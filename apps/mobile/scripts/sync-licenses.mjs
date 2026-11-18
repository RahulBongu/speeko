#!/usr/bin/env node
/**
 * sync-licenses.mjs — bundle the repository license texts for the mobile app.
 *
 * The Android app must ship the notices and license texts (Apache-2.0 section 4,
 * OFL-1.1). Metro can import JSON on every platform, so this script writes one
 * `assets/licenses/licenses.json` that the Licenses screen renders verbatim.
 *
 * Line endings are canonicalised to LF so the committed JSON is identical on
 * Windows and Linux. Run after changing any of the source texts:
 *   node apps/mobile/scripts/sync-licenses.mjs
 *
 * `pnpm check:licenses` fails if the JSON drifts from the sources.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, '..');
const repoRoot = join(appRoot, '..', '..');

const SOURCES = {
  license: 'LICENSE',
  content: 'LICENSE-CONTENT',
  notice: 'NOTICE',
  fonts: 'apps/web/public/fonts/OFL.txt',
};

const canonical = (text) => text.replace(/\r\n/g, '\n');

const documents = {};
for (const [key, relativePath] of Object.entries(SOURCES)) {
  const text = canonical(await readFile(join(repoRoot, relativePath), 'utf8'));
  if (!text.trim()) throw new Error(`${relativePath} is empty`);
  documents[key] = text;
}

const outputPath = join(appRoot, 'assets', 'licenses', 'licenses.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(documents, null, 2)}\n`, 'utf8');

const bytes = Buffer.byteLength(JSON.stringify(documents), 'utf8');
console.log(`sync-licenses: wrote ${outputPath} (${bytes} bytes, ${Object.keys(documents).length} texts)`);
