import { Text, View } from 'react-native';
import { ALL_LOCALES, LOCALE_LABEL } from '@speeko/core';

export default function Home() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 48 }}>🦊</Text>
      <Text style={{ fontSize: 36, fontWeight: '700', color: '#16a34a' }}>Speeko</Text>
      <Text style={{ marginTop: 8, color: '#555' }}>Learn a new language, one lesson at a time.</Text>
      <Text style={{ marginTop: 24, fontWeight: '600' }}>Supported languages</Text>
      {ALL_LOCALES.map((l) => (
        <Text key={l} style={{ marginTop: 4 }}>
          {LOCALE_LABEL[l]} ({l})
        </Text>
      ))}
    </View>
  );
}
