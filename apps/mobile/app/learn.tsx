import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../lib/api';

interface CourseEntry { id: string; title: string; locale: string; }

export default function Learn() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/courses`)
      .then((r) => r.json())
      .then((data) => setCourses(Array.isArray(data) ? data : data?.courses ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load courses.'));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#b91c1c' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '900', marginBottom: 12 }}>Learn</Text>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/path/${item.id}`)}
            style={{ padding: 16, borderRadius: 12, backgroundColor: '#fff', marginBottom: 10, borderWidth: 1, borderColor: '#eee' }}
          >
            <Text style={{ fontWeight: '800' }}>{item.title}</Text>
            <Text style={{ color: '#666' }}>{item.locale}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
