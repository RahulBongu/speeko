// QA-only Expo config plugin: permit cleartext HTTP ONLY to localhost/127.0.0.1.
//
// Android blocks cleartext HTTP by default for targetSdk >= 28, so a release
// build cannot reach the local API at http://localhost:3001 over adb reverse.
// This plugin copies a loopback-only network_security_config.xml into the
// android project and points the <application> element at it. It is ENABLED
// ONLY when SPEEKO_QA_LOOPBACK_CLEARTEXT=1 is set at prebuild time — without
// it the plugin is a no-op and release/store builds carry no cleartext
// exception.
//
// Usage (QA builds only):
//   SPEEKO_QA_LOOPBACK_CLEARTEXT=1 npx expo prebuild --no-install
//
// The android/ directory is gitignored, so this file is the source of truth;
// editing android/ directly does not survive a fresh prebuild.
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SECURITY_CONFIG_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
  </domain-config>
</network-security-config>
`;

module.exports = function withQaLoopbackCleartext(config) {
  if (process.env.SPEEKO_QA_LOOPBACK_CLEARTEXT !== '1') {
    return config;
  }

  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const xmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app/src/main/res/xml',
      );
      await fs.promises.mkdir(xmlDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(xmlDir, 'network_security_config.xml'),
        SECURITY_CONFIG_XML,
        'utf8',
      );
      return modConfig;
    },
  ]);

  config = withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return manifestConfig;
  });

  return config;
};
