const { execFileSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');

// Cross-platform wrapper for `expo export --platform web`.
// Metro resolves the project root to the monorepo root when the workspace
// layout is detected, which breaks resolving the `app/` directory. Setting
// EXPO_NO_METRO_WORKSPACE_ROOT here keeps the Expo project root at the app.
try {
  execFileSync(
    'pnpm',
    ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist'],
    {
      stdio: 'inherit',
      cwd: projectRoot,
      env: { ...process.env, EXPO_NO_METRO_WORKSPACE_ROOT: '1' },
      shell: true,
    },
  );
} catch (error) {
  process.exit(typeof error.status === 'number' ? error.status : 1);
}
