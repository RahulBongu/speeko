// Builds course bundles from ../../content and copies them into public/courses.
// Run automatically by `predev` / `prebuild` in apps/web.
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const repoRoot = resolve(webRoot, '..', '..');
const contentDir = resolve(repoRoot, 'content');
const distDir = resolve(contentDir, 'dist');
const outDir = resolve(webRoot, 'public', 'courses');
const cli = resolve(repoRoot, 'packages', 'content', 'dist', 'cli.js');

if (!existsSync(cli)) {
  console.log('[sync-courses] building @speeko/content...');
  const res = spawnSync('pnpm', ['--filter', '@speeko/content', 'run', 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

console.log('[sync-courses] building course bundle...');
execFileSync(process.execPath, [cli, 'build', contentDir, distDir], { stdio: 'inherit' });

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const files = readdirSync(distDir).filter((f) => f.endsWith('.json'));
for (const f of files) {
  copyFileSync(resolve(distDir, f), resolve(outDir, f));
}
// Copy bundled audio assets (listenChoose) if present.
const audioSrcDir = resolve(contentDir, 'audio');
const audioOutDir = resolve(outDir, 'audio');
if (existsSync(audioSrcDir)) {
  rmSync(audioOutDir, { recursive: true, force: true });
  mkdirSync(audioOutDir, { recursive: true });
  for (const f of readdirSync(audioSrcDir)) {
    copyFileSync(resolve(audioSrcDir, f), resolve(audioOutDir, f));
  }
  console.log(`[sync-courses] copied audio -> ${audioOutDir}`);
}
console.log(`[sync-courses] copied ${files.length} course files -> ${outDir}`);
