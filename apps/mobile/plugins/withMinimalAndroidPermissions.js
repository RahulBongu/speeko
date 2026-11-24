// Keep the generated Android manifest to the permissions Speeko actually
// needs. Expo autolinking adds a few legacy/default permissions to fresh
// prebuilds; the privacy inventory and store data-safety declaration only
// cover INTERNET and VIBRATE. Removing them here (instead of editing the
// gitignored android/ directory) makes the change survive `expo prebuild
// --clean`.
const { withAndroidManifest } = require('@expo/config-plugins');

const REMOVE = new Set([
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
]);

module.exports = function withMinimalAndroidPermissions(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    if (Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (entry) => !REMOVE.has(entry?.$?.['android:name']),
      );
    }
    return mod;
  });
};
