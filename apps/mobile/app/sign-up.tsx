import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ORIGIN, apiFetch } from '../lib/api';
import { syncProgress } from '../lib/sync';
import { Screen } from '../components/Screen';
import { TactileButton } from '../components/Tactile';
import { COLORS } from '../lib/theme';

const fieldStyle = {
  borderWidth: 2,
  borderBottomWidth: 4,
  borderColor: COLORS.line,
  borderBottomColor: '#D8CBB2',
  borderRadius: 12,
  padding: 12,
  backgroundColor: COLORS.white,
  color: COLORS.dark,
};

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { origin: ORIGIN },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        let message = 'Sign up failed.';
        try {
          const body = (await response.json()) as { message?: unknown; error?: unknown };
          if (typeof body.message === 'string') message = body.message;
          else if (typeof body.error === 'string') message = body.error;
        } catch {
          // Keep the default message.
        }
        throw new Error(message);
      }
      try {
        await syncProgress();
      } catch {
        // Non-fatal: the account screen retries the merge.
      }
      // Account created — celebrate. Haptics never block navigation.
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Intentionally non-fatal.
      }
      router.replace('/learn');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  }

  const ready = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          gap: 14,
          backgroundColor: COLORS.cream,
          flexGrow: 1,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
      {/* Top minimal bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: COLORS.dark,
            backgroundColor: COLORS.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontWeight: '900', color: COLORS.dark }}>←</Text>
        </Pressable>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: 2,
            borderColor: COLORS.dark,
            backgroundColor: COLORS.creamDeep,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: COLORS.fox,
            }}
          />
          <Text style={{ fontWeight: '900', color: COLORS.green, fontSize: 14 }}>
            speek<Text style={{ color: COLORS.fox }}>o</Text>
          </Text>
        </View>
        {/* Empty spacer balancing the back button so the wordmark stays centered.
            Decorative only — hidden from assistive tech. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{ width: 44, height: 44 }}
        />
      </View>

      <View style={{ alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            borderWidth: 3,
            borderColor: COLORS.dark,
            backgroundColor: COLORS.creamDeep,
            overflow: 'hidden',
          }}
        >
          <Image
            source={require('../assets/fox.png')}
            accessibilityLabel="Speeko the fox"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark, textAlign: 'center' }}>
          Join Speeko
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, textAlign: 'center' }}>
          Accounts keep verified XP, gems, and cosmetics in sync. Your device lessons merge in on
          sign-up.
        </Text>
      </View>

      {/* Segmented auth switcher */}
      <View
        style={{
          flexDirection: 'row',
          gap: 6,
          padding: 4,
          borderWidth: 2,
          borderColor: COLORS.dark,
          borderRadius: 999,
          backgroundColor: COLORS.creamDeep,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: false }}
          onPress={() => router.replace('/sign-in')}
          style={{
            flex: 1,
            borderRadius: 999,
            backgroundColor: COLORS.white,
            borderWidth: 2,
            borderColor: COLORS.line,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontWeight: '900', color: COLORS.dark }}>Sign in</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          style={{
            flex: 1,
            borderRadius: 999,
            backgroundColor: COLORS.green,
            borderWidth: 2,
            borderColor: COLORS.greenDark,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontWeight: '900', color: COLORS.white }}>Create account</Text>
        </Pressable>
      </View>

      <View
        style={{
          borderWidth: 2,
          borderBottomWidth: 5,
          borderColor: COLORS.line,
          borderBottomColor: '#D8CBB2',
          borderRadius: 22,
          padding: 18,
          gap: 12,
          backgroundColor: COLORS.white,
        }}
      >
        <TextInput
          accessibilityLabel="Name"
          value={name}
          onChangeText={setName}
          placeholder="Name"
          style={fieldStyle}
        />
        <TextInput
          accessibilityLabel="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={fieldStyle}
        />
        <TextInput
          accessibilityLabel="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password (at least 8 characters)"
          secureTextEntry
          style={fieldStyle}
        />
        {password.length > 0 && password.length < 8 ? (
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            Use at least 8 characters, matching the web sign-up form.
          </Text>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>
            {error}
          </Text>
        ) : null}

        <TactileButton
          label={busy ? 'Creating…' : 'Create account'}
          onPress={() => void submit()}
          disabled={busy || !ready}
          style={{ alignSelf: 'stretch' }}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={{ padding: 8, alignItems: 'center' }}
      >
        <Text style={{ color: COLORS.dark, fontWeight: '700' }}>Back</Text>
      </Pressable>
      </ScrollView>
    </Screen>
  );
}
