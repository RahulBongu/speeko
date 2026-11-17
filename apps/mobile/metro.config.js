// Metro configuration for this Expo app inside the Speeko pnpm monorepo.
// Expo already enables symlinks and monorepo defaults, but Metro still needs
// to see the workspace root to resolve packages from the hoisted layout.
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');
const monorepoNodeModules = path.resolve(monorepoRoot, 'node_modules');
const packagesDir = path.resolve(monorepoRoot, 'packages');

const config = getDefaultConfig(projectRoot);

// Force the resolver to prefer CommonJS helpers. The default
// ['require', 'import'] causes `@babel/runtime/helpers/interopRequireDefault`
// to resolve to the ESM variant, which exposes a default export object and
// breaks Babel-generated CJS call sites at runtime.
config.resolver.unstable_conditionNames = ['require'];

// The pnpm store lives under the monorepo root and packages are hoisted
// there. Only watch the folders Metro actually needs to resolve: the
// monorepo node_modules plus the workspace packages.
config.watchFolders = [monorepoNodeModules, packagesDir];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  monorepoNodeModules,
];

module.exports = config;
