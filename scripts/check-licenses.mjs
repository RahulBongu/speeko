#!/usr/bin/env node
/**
 * check-licenses.mjs — guard the mobile license bundle against drift.
 *
 * `apps/mobile/assets/licenses/licenses.json` is generated from the repository
 * texts and committed so Metro can import it. This check fails if a source text
 * changes without regenerating the bundle, which would mean a rebuilt APK ships
 * stale or incomplete notices.
 *
 * No dependencies. Usage:
 *   node scripts/check-licenses.mjs
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const SOURCES = {
  license: 'LICENSE',
  content: 'LICENSE-CONTENT',
  notice: 'NOTICE',
  fonts: 'apps/web/public/fonts/OFL.txt',
};
const BUNDLE = 'apps/mobile/assets/licenses/licenses.json';

const canonical = (text) => text.replace(/\r\n/g, '\n');

async function main() {
  const bundle = JSON.parse(await readFile(join(repoRoot, BUNDLE), 'utf8'));
  const problems = [];

  for (const [key, relativePath] of Object.entries(SOURCES)) {
    const source = canonical(await readFile(join(repoRoot, relativePath), 'utf8'));
    if (typeof bundle[key] !== 'string') {
      problems.push(`${BUNDLE}: missing "${key}"`);
      continue;
    }
    if (canonical(bundle[key]) !== source) {
      problems.push(
        `${BUNDLE}: "${key}" does not match ${relativePath} — run ` +
          '`node apps/mobile/scripts/sync-licenses.mjs`',
      );
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`check:licenses FAIL — ${problem}`);
    process.exit(1);
  }

  const totalBytes = Object.values(SOURCES).length;
  console.log(`check:licenses PASS — ${totalBytes} bundled texts match their sources`);
}

await main();
