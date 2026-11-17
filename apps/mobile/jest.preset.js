/**
 * Custom Jest preset for the pnpm workspace.
 *
 * `jest-expo` derives its setup from the hoisted `node_modules/react-native`
 * copy, while this workspace resolves `react-native` through a pnpm junction
 * to `node_modules/.pnpm/react-native@.../node_modules/react-native`.
 * Jest keys explicit mocks by resolved path, so React Native's own Jest setup
 * registered mocks for the hoisted copy and the tests loaded the real module,
 * producing `__fbBatchedBridgeConfig is not set`.
 *
 * Point the setup file and every `react-native` import at the same real path
 * so the official Expo/React Native mocks apply to the modules tests load.
 * React itself is mapped too, because the renderer is hoisted and a second
 * React copy breaks hooks.
 */
const fs = require('node:fs');
const path = require('node:path');

const expoPreset = require('jest-expo/jest-preset');

const reactNativePackage = fs.realpathSync(require.resolve('react-native/package.json'));
const reactNativeRoot = path.dirname(reactNativePackage);
const reactNativeEntry = fs.realpathSync(require.resolve('react-native'));
const reactNativeJestSetup = fs.realpathSync(require.resolve('react-native/jest/setup.js'));

// Same issue for React: the renderer and testing library are hoisted at the
// workspace root, while app files resolve React through a pnpm junction. Two
// React copies mean hooks render with a different dispatcher and fail with
// "Cannot read properties of null (reading 'useState')". Point every React
// import at the copy the renderer uses.
const rendererRoot = path.dirname(fs.realpathSync(require.resolve('react-test-renderer/package.json')));
const reactRoot = path.dirname(
  fs.realpathSync(require.resolve('react/package.json', { paths: [rendererRoot] })),
);
const reactEntry = fs.realpathSync(
  require.resolve('react', { paths: [rendererRoot] }),
);

const setupFileIsReactNativeSetup = (file) =>
  /react-native[\\/]jest[\\/]setup\.js$/.test(file);

module.exports = {
  ...expoPreset,
  setupFiles: [
    reactNativeJestSetup,
    ...expoPreset.setupFiles.filter((file) => !setupFileIsReactNativeSetup(file)),
  ],
  moduleNameMapper: {
    ...expoPreset.moduleNameMapper,
    '^react$': reactEntry,
    '^react/(.*)$': path.join(reactRoot, '$1'),
    '^react-native$': reactNativeEntry,
    '^react-native/(.*)$': path.join(reactNativeRoot, '$1'),
  },
};
