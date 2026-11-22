import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ORIGIN, apiFetch } from '../lib/api';
import { syncProgress } from '../lib/sync';
import { Screen } from '../components/Screen';
import { Fox } from '../components/Fox';
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

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { origin: ORIGIN },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        let message = 'Sign in failed. Check your email and password.';
        try {
          const body = (await response.json()) as { message?: unknown; error?: unknown };
          if (typeof body.message === 'string') message = body.message;
          else if (typeof body.error === 'string') message = body.error;
        } catch {
          // Keep the default message.
        }
        throw new Error(message);
      }
      // Bring this device's guest progress into the account before leaving the
      // screen. A sync failure does not block sign-in; the account screen
      // retries and the device snapshot is not lost.
      try {
        await syncProgress();
      } catch {
        // Intentionally non-fatal.
      }
      // Signed in — let the fox celebrate with you. Haptics never block navigation.
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Intentionally non-fatal.
      }
      router.replace('/learn');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

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
        {/* Balances the back button so the wordmark stays centered. Decorative
            only — hidden from assistive tech, like the sign-up spacer. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{ width: 44, height: 44 }}
        />
      </View>

      {/* Mascot and speech bubble */}
      <View style={{ alignItems: 'center', gap: 10 }}>
        <View
          style={{
            borderWidth: 2,
            borderColor: COLORS.dark,
            backgroundColor: COLORS.white,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            maxWidth: 300,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.muted, marginBottom: 2 }}>
            SPEEKO
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.dark, textAlign: 'center' }}>
            Ready to keep your streak going?
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: 2 }}>
            Sign in to sync your progress.
          </Text>
        </View>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 3,
            borderColor: COLORS.dark,
            backgroundColor: COLORS.creamDeep,
            overflow: 'hidden',
            shadowColor: COLORS.dark,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Fox
            mood="happy"
            title="Speeko the fox"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
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
          <Text style={{ fontWeight: '900', color: COLORS.white }}>Sign in</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: false }}
          onPress={() => router.push('/sign-up')}
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
          <Text style={{ fontWeight: '900', color: COLORS.dark }}>Create account</Text>
        </Pressable>
      </View>

      {/* Auth card */}
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
        <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>Welcome back</Text>
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          Signing in merges this device&apos;s lessons into your account. Verified XP and gems only
          come from server-checked attempts.
        </Text>

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
          placeholder="Password"
          secureTextEntry
          style={fieldStyle}
        />

        {error ? (
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>
            {error}
          </Text>
        ) : null}

        <TactileButton
          label={busy ? 'Signing in…' : 'Sign in'}
          onPress={() => void submit()}
          disabled={busy || !email.trim() || !password}
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
