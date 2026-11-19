// Cross-platform wrapper for `expo export --platform web`.
// Metro resolves the project root to the monorepo root when the workspace
// layout is detected, which breaks resolving the `app/` directory. Setting
// EXPO_NO_METRO_WORKSPACE_ROOT=1 keeps the Expo project root at the app
// itself, matching how the Android release bundle is built.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const expoPackageJson = require.resolve('expo/package.json', { paths: [projectRoot] });
const expoCli = path.join(path.dirname(expoPackageJson), '..', '@expo', 'cli', 'build', 'bin', 'cli');

try {
  execFileSync(
    process.execPath,
    [expoCli, 'export', '--platform', 'web', '--output-dir', 'dist'],
    {
      stdio: 'inherit',
      cwd: projectRoot,
      env: { ...process.env, EXPO_NO_METRO_WORKSPACE_ROOT: '1' },
    },
  );
} catch (error) {
  process.exit(typeof error.status === 'number' ? error.status : 1);
}
