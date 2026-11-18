// Copies the project license texts into public/licenses so they ship with the
// web artifact (Apache-2.0 section 4 requires recipients to receive a copy of
// the License). Run automatically by `predev` / `prebuild` in apps/web.
// The mobile app still bundles these at packaging time (see deploy-runbook.md).
import { mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const repoRoot = resolve(webRoot, '..', '..');
const outDir = resolve(webRoot, 'public', 'licenses');

const files = [
  { src: resolve(repoRoot, 'LICENSE'), name: 'LICENSE' },
  { src: resolve(repoRoot, 'LICENSE-CONTENT'), name: 'LICENSE-CONTENT' },
  { src: resolve(repoRoot, 'NOTICE'), name: 'NOTICE' },
  { src: resolve(webRoot, 'public', 'fonts', 'OFL.txt'), name: 'OFL.txt' },
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const file of files) {
  if (!existsSync(file.src)) {
    console.error(`[sync-licenses] missing source: ${file.src}`);
    process.exit(1);
  }
  copyFileSync(file.src, resolve(outDir, file.name));
}

console.log(`[sync-licenses] copied ${files.length} license files -> ${outDir}`);