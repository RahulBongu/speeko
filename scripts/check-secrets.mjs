#!/usr/bin/env node
/**
 * check-secrets.mjs — fail the build if secret-like values appear in build outputs.
 *
 * No dependencies. Usage:
 *   node scripts/check-secrets.mjs
 *
 * Behaviour:
 *   (a) Candidate output dirs are located dynamically relative to the repo root
 *       (scripts/..): apps/web/.next/static, apps/web/out, apps/mobile/dist
 *       (Android web export) and apps/api/dist (compiled JS). A missing dir is
 *       noted as skipped; everything that exists is scanned.
 *   (b) Env values are collected from .env, apps/api/.env, apps/web/.env and
 *       apps/mobile/.env when present; non-empty values >= 8 chars are searched
 *       by VALUE and reported by NAME. Independently, outputs are always scanned
 *       with well-known secret patterns (Stripe live keys, private key blocks,
 *       BETTER_AUTH_SECRET / generic high-entropy secret assignments and
 *       password assignments in bundles) so secrets configured only in CI or a
 *       deployed environment are still detected.
 *   (c) On a match this prints the FILE and the secret NAME (or
 *       "matched pattern '<name>'"). The secret VALUE is never printed.
 *   (d) Exit code 1 when anything is found, 0 otherwise.
 *   (e) A summary line reports dirs scanned and file/hit counts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const CANDIDATE_DIRS = [
  { label: 'web-next-static', rel: path.join('apps', 'web', '.next', 'static') },
  { label: 'web-static-export', rel: path.join('apps', 'web', 'out') },
  { label: 'mobile-web-export', rel: path.join('apps', 'mobile', 'dist') },
  { label: 'api-dist', rel: path.join('apps', 'api', 'dist') },
];

const SCANNABLE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx',
  '.css', '.html', '.htm', '.json', '.map', '.txt', '.xml', '.svg', '.webmanifest',
]);

const ENV_PATHS = [
  path.join('.env'),
  path.join('apps', 'api', '.env'),
  path.join('apps', 'web', '.env'),
  path.join('apps', 'mobile', '.env'),
];

const MAX_FILE_BYTES = 32 * 1024 * 1024; // skip anything larger, note it
const MIN_ENV_VALUE_LENGTH = 8;

/** Benign literals that look like password assignments but are not secrets. */
const BENIGN_PASSWORD_VALUES = new Set([
  'current-password',
  'new-password',
  'one-time-code',
  'webauthn',
]);

const FALLBACK_PATTERNS = [
  { name: 'stripe-live-secret-key', re: /sk_live_[0-9A-Za-z]{8,}/g },
  { name: 'stripe-live-restricted-key', re: /rk_live_[0-9A-Za-z]{8,}/g },
  {
    name: 'private-key-block',
    re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/g,
  },
  {
    // e.g. BETTER_AUTH_SECRET: "…", BETTER_AUTH_SECRET=…, "BETTER_AUTH_SECRET": "…"
    name: 'better-auth-secret-assignment',
    re: /BETTER_AUTH_SECRET["']?\s*[:=]\s*["'][^"'\s]{16,}["']/gi,
  },
  {
    // secret/token-ish key names assigned a long high-entropy-ish literal
    name: 'high-entropy-secret-assignment',
    re: /[A-Za-z0-9_.-]*(?:SECRET|TOKEN|PRIVATE_KEY|API_KEY)[A-Za-z0-9_.-]*["']?\s*[:=]\s*["'][A-Za-z0-9+/=_-]{32,}["']/gi,
  },
  {
    name: 'generic-secret-assignment',
    re: /["']?(?:client_secret|api_key|apikey|auth_token|access_token|private_key|secret_key)["']?\s*[:=]\s*["'][A-Za-z0-9+/=_.-]{20,}["']/gi,
  },
  {
    name: 'password-assignment',
    re: /["']?password["']?\s*[:=]\s*["'][^"'\s]{8,}["']/gi,
    benignValues: BENIGN_PASSWORD_VALUES,
    valueRe: /["']([^"'\s]{8,})["']\s*$/,
  },
];

function parseEnvFile(envPath) {
  const entries = [];
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice('export '.length).trim();
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const name = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)) continue;
    let value = line.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    } else {
      const comment = value.indexOf(' #');
      if (comment !== -1) value = value.slice(0, comment).trim();
    }
    if (value.length < MIN_ENV_VALUE_LENGTH) continue;
    entries.push({ name, value });
  }
  return entries;
}

function walkFiles(dir) {
  const files = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let dirents;
    try {
      dirents = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const dirent of dirents) {
      const full = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        stack.push(full);
      } else if (dirent.isFile()) {
        files.push(full);
      }
    }
  }
  return files;
}

function lineNumberAt(content, index) {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function rel(absPath) {
  return path.relative(repoRoot, absPath) || absPath;
}

function main() {
  const hits = [];
  let filesScanned = 0;
  let bytesScanned = 0;
  let dirsScanned = 0;
  let dirsSkipped = 0;
  const notes = [];

  // Secrets can be configured in any workspace package or at the repo root.
  // Load every available env file by value (never printing a value), but keep
  // the pattern scan active as well: a value-only scan misses secrets that
  // were configured in a different environment (CI, Vercel, EAS).
  const envEntries = [];
  const envNames = new Set();
  for (const relPath of ENV_PATHS) {
    const envPath = path.join(repoRoot, relPath);
    if (!fs.existsSync(envPath)) continue;
    try {
      for (const entry of parseEnvFile(envPath)) {
        if (envNames.has(entry.name)) continue;
        envNames.add(entry.name);
        envEntries.push(entry);
      }
    } catch (err) {
      notes.push(`${relPath} could not be parsed (${err.message}); continuing with pattern scan`);
    }
  }
  const mode = envEntries.length > 0
    ? `${envEntries.length} env value(s) + ${FALLBACK_PATTERNS.length} fallback patterns`
    : `${FALLBACK_PATTERNS.length} fallback patterns (no env values available)`;

  for (const candidate of CANDIDATE_DIRS) {
    const absDir = path.join(repoRoot, candidate.rel);
    if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
      dirsSkipped += 1;
      console.log(`[skip] ${candidate.rel} (not present)`);
      continue;
    }
    dirsScanned += 1;
    const files = walkFiles(absDir);
    let dirFiles = 0;
    let dirBytes = 0;
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!SCANNABLE_EXTENSIONS.has(ext)) continue;
      let stat;
      try {
        stat = fs.statSync(file);
      } catch {
        continue;
      }
      if (stat.size > MAX_FILE_BYTES) {
        notes.push(`skipped oversized file ${rel(file)} (${stat.size} bytes)`);
        continue;
      }
      let content;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch (err) {
        notes.push(`unreadable file ${rel(file)} (${err.message})`);
        continue;
      }
      dirFiles += 1;
      dirBytes += stat.size;

      for (const entry of envEntries) {
        const index = content.indexOf(entry.value);
        if (index !== -1) {
          hits.push({ file: rel(file), line: lineNumberAt(content, index), name: entry.name });
        }
      }
      {
        for (const pattern of FALLBACK_PATTERNS) {
          pattern.re.lastIndex = 0;
          let match;
          while ((match = pattern.re.exec(content)) !== null) {
            const text = match[0];
            if (pattern.benignValues) {
              const valueMatch = pattern.valueRe.exec(text);
              if (valueMatch && pattern.benignValues.has(valueMatch[1])) continue;
            }
            hits.push({
              file: rel(file),
              line: lineNumberAt(content, match.index),
              name: `matched pattern '${pattern.name}'`,
            });
            if (pattern.re.lastIndex === match.index) pattern.re.lastIndex += 1;
          }
        }
      }
    }
    console.log(`[scan] ${candidate.rel} (${dirFiles} files, ${dirBytes} bytes)`);
    filesScanned += dirFiles;
    bytesScanned += dirBytes;
  }

  for (const note of notes) console.log(`[note] ${note}`);

  if (hits.length > 0) {
    for (const hit of hits) {
      // Never print the secret value — file + name/pattern only.
      console.error(`SECRET DETECTED in ${hit.file}:${hit.line} — ${hit.name}`);
    }
  }

  console.log(
    `Summary: dirs scanned ${dirsScanned}/${CANDIDATE_DIRS.length} (${dirsSkipped} absent), ` +
      `${filesScanned} files (${bytesScanned} bytes), ${hits.length} hit(s). Mode: ${mode}.`,
  );
  console.log(hits.length > 0 ? 'FAIL: secret-like values found in build outputs.' : 'PASS: no secret-like values found in build outputs.');

  process.exit(hits.length > 0 ? 1 : 0);
}

try {
  main();
} catch (err) {
  console.error(`check-secrets: unexpected error: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
}
