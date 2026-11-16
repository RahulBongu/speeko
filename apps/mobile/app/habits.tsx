import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL, ORIGIN } from '../lib/api';

export default function Habits() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/habits`, { credentials: 'include', headers: { origin: ORIGIN } })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => setData(body?.habits ?? null))
      .catch(() => setData(null));
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Habits</Text>
      {data ? (
        <>
          <Text>Streak: {data.streak?.current ?? 0}</Text>
          <Text>Today: {data.today?.xp ?? 0} / {data.dailyGoal} XP</Text>
          <Text>Freezes: {data.streak?.freezesAvailable ?? 0} / {data.streak?.maxFreezes ?? 2}</Text>
        </>
      ) : (
        <Text>Sign in to see verified habits.</Text>
      )}
      <Pressable onPress={() => router.back()} style={{ backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>Back</Text>
      </Pressable>
    </View>
  );
}
