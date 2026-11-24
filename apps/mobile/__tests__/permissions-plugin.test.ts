/**
 * The generated Android project is gitignored, so unwanted permissions must be
 * removed by a config plugin that survives `expo prebuild --clean`.
 */
const withMinimalAndroidPermissions = require('../plugins/withMinimalAndroidPermissions');

test('config plugin keeps only INTERNET and VIBRATE permissions', () => {
  const config = withMinimalAndroidPermissions({ expo: { name: 'Speeko' } });
  const mod = config.mods?.android?.manifest;
  expect(typeof mod).toBe('function');

  const fakeMod: any = {
    modResults: {
      manifest: {
        'uses-permission': [
          { $: { 'android:name': 'android.permission.INTERNET' } },
          { $: { 'android:name': 'android.permission.VIBRATE' } },
          { $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' } },
          { $: { 'android:name': 'android.permission.READ_EXTERNAL_STORAGE', 'android:maxSdkVersion': '32' } },
          { $: { 'android:name': 'android.permission.WRITE_EXTERNAL_STORAGE', 'android:maxSdkVersion': '32' } },
        ],
      },
    },
  };
  mod(fakeMod);
  expect(fakeMod.modResults.manifest['uses-permission'].map((p: any) => p.$['android:name'])).toEqual([
    'android.permission.INTERNET',
    'android.permission.VIBRATE',
  ]);
});
