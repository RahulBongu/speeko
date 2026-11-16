import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL, ORIGIN } from '../lib/api';

export default function Account() {
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/progress`, { credentials: 'include', headers: { origin: ORIGIN } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProgress(data?.progress ?? null))
      .catch(() => setProgress(null));
  }, []);

  async function signOut() {
    await fetch(`${API_URL}/api/auth/sign-out`, { method: 'POST', credentials: 'include', headers: { origin: ORIGIN } });
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Account</Text>
      {progress ? (
        <>
          <Text>XP: {progress.xp}</Text>
          <Text>Streak: {progress.streak}</Text>
          <Text>Daily goal: {progress.dailyGoal} XP</Text>
        </>
      ) : (
        <Text>Sign in to sync progress.</Text>
      )}
      <Pressable onPress={signOut} style={{ backgroundColor: '#eee', borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ fontWeight: '800' }}>Sign out</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/learn')} style={{ backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>Learn</Text>
      </Pressable>
    </View>
  );
}
