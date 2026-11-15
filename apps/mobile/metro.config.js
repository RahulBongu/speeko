// Metro configuration for this Expo app inside the Speeko pnpm monorepo.
// Expo already enables symlinks and monorepo defaults, but Metro still needs
// to see the workspace root to resolve packages from the hoisted layout.
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');
const monorepoNodeModules = path.resolve(monorepoRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// The pnpm store lives under the monorepo root and packages are hoisted
// there. Metro only needs to watch that folder, not the whole repo.
config.watchFolders = [monorepoNodeModules];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  monorepoNodeModules,
];

module.exports = config;
