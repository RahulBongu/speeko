// Metro configuration for the Expo app. Uses Expo's defaults and enables
// symlink support required by pnpm's store.
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enableSymlinks = true;

module.exports = config;
