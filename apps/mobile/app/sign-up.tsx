import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL, ORIGIN } from '../lib/api';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) throw new Error('Sign up failed.');
      router.replace('/learn');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '900' }}>Create account</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Name" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12 }} />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12 }} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12 }} />
      {error ? <Text style={{ color: '#b91c1c' }}>{error}</Text> : null}
      <Pressable onPress={submit} disabled={busy} style={{ backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? 'Creating…' : 'Create account'}</Text>
      </Pressable>
    </View>
  );
}
