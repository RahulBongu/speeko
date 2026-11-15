// Metro configuration for this Expo app inside the Speeko pnpm monorepo.
// Expo already enables symlinks and monorepo defaults, but Metro still needs
// to see the workspace root to resolve packages from the hoisted layout.
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
