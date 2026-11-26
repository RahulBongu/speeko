import { Platform, ScrollView, Text, View } from 'react-native';
import { AppNav } from '../components/AppNav';
import { Screen } from '../components/Screen';
import { SpeekoAppBar } from '../components/Tactile';
import { LICENSE_DOCUMENTS, LICENSE_SUMMARY } from '../lib/licenses';
import { COLORS } from '../lib/theme';

const MONOSPACE = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

/**
 * In-app license screen. The bundled texts satisfy Apache-2.0 section 4 and
 * the OFL-1.1 notice requirement for a distributed APK/AAB.
 */
export default function Licenses() {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          padding: 18,
          gap: 14,
          backgroundColor: COLORS.cream,
          flexGrow: 1,
        }}
      >
        <SpeekoAppBar subtitle="Licenses and attributions" />

        <Text
          accessibilityRole="header"
          style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}
        >
          Licenses and attributions
        </Text>
        <Text style={{ color: COLORS.muted, lineHeight: 20 }}>{LICENSE_SUMMARY}</Text>

        {LICENSE_DOCUMENTS.map((document) => (
          <View
            key={document.id}
            style={{
              padding: 16,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: COLORS.line,
              backgroundColor: COLORS.white,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark }}>
              {document.title}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted }}>
              {document.filename}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 12,
                lineHeight: 18,
                color: COLORS.dark,
                fontFamily: MONOSPACE,
              }}
            >
              {document.text}
            </Text>
          </View>
        ))}
      </ScrollView>
      <AppNav active="account" />
    </Screen>
  );
}
