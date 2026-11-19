// Jest preset for the orphaned Expo 56 monorepo setup.
// React Native no longer ships jest/setup.js (moved to @react-native/jest-preset);
// jest-expo already wires that preset up, so point straight at it and add only
// the minimal pnpm-workspace accommodations.
const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...expoPreset,
};