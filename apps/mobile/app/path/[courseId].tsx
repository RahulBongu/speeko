import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { API_URL } from '../../lib/api';

interface Lesson { id: string; title: string; }

export default function Path() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    fetch(`${API_URL}/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((course) => {
        setTitle(course.title ?? courseId);
        const flat: Lesson[] = [];
        for (const unit of course.units ?? []) {
          for (const lesson of unit.lessons ?? []) {
            flat.push({ id: lesson.id, title: lesson.title });
          }
        }
        setLessons(flat);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load course.'));
  }, [courseId]);

  if (error) {
    return <View style={{ flex: 1, padding: 24 }}><Text style={{ color: '#b91c1c' }}>{error}</Text></View>;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '900', marginBottom: 12 }}>{title}</Text>
      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/lesson/${courseId}/${item.id}`)}
            style={{ padding: 16, borderRadius: 12, backgroundColor: '#fff', marginBottom: 10, borderWidth: 1, borderColor: '#eee' }}
          >
            <Text style={{ fontWeight: '800' }}>{item.title}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
