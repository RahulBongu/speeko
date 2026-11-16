import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { API_URL, ORIGIN } from '../../../lib/api';
import { gradeExercise } from '@speeko/core';

interface Exercise {
  id: string;
  kind: string;
  prompt: string;
  options?: string[];
  answerIndex?: number;
  expected?: string[];
}

interface Lesson { id: string; title: string; xpReward: number; exercises: Exercise[]; }

export default function Lesson() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [finished, setFinished] = useState(false);
  const [xp, setXp] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    fetch(`${API_URL}/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((course) => {
        for (const unit of course.units ?? []) {
          const found = (unit.lessons ?? []).find((l: any) => l.id === lessonId);
          if (found) setLesson(found);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load lesson.'));
  }, [courseId, lessonId]);

  if (error) return <View style={{ flex: 1, padding: 24 }}><Text style={{ color: '#b91c1c' }}>{error}</Text></View>;
  if (!lesson) return <View style={{ flex: 1, padding: 24 }}><Text>Loading…</Text></View>;

  const exercise = lesson.exercises[index];

  function submitAnswer() {
    if (!exercise) return;
    let answerInput: any;
    if (exercise.kind === 'chooseMeaning') {
      if (selected === null) return;
      answerInput = { kind: 'choice', index: selected };
    } else if (exercise.kind === 'typeTranslation') {
      answerInput = { kind: 'text', value: input };
    } else {
      // Unsupported on mobile: skip without grading.
      answerInput = null;
    }

    let result: any = { correct: true, xp: 0 };
    if (answerInput) {
      result = gradeExercise(exercise as any, answerInput);
    }
    const nextAnswers = [...answers, { exerciseId: exercise.id, input: answerInput ?? { kind: 'choice', index: 0 }, ms: 1000 }];
    setAnswers(nextAnswers);

    if (!result.correct && answerInput) {
      setHearts((h) => Math.max(0, h - 1));
      setFeedback('Not quite');
    } else {
      setFeedback('Correct!');
    }

    setTimeout(() => {
      setFeedback(null);
      setInput('');
      setSelected(null);
      if (index + 1 >= (lesson?.exercises.length ?? 0)) {
        finishLesson(nextAnswers);
      } else {
        setIndex((i) => i + 1);
      }
    }, 600);
  }

  async function finishLesson(finalAnswers: any[]) {
    setFinished(true);
    const attemptId = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const response = await fetch(`${API_URL}/api/lesson-completions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({
          attemptId,
          courseId,
          lessonId,
          answers: finalAnswers,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setXp(data?.event?.xp ?? lesson?.xpReward ?? 0);
      }
    } catch {
      // Leave XP at 0 if sync fails.
    }
  }

  if (finished) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '900' }}>Lesson complete!</Text>
        <Text style={{ fontSize: 18 }}>+{xp} XP</Text>
        <Pressable onPress={() => router.back()} style={{ backgroundColor: '#16a34a', borderRadius: 12, padding: 14 }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Done</Text>
        </Pressable>
      </View>
    );
  }

  if (!exercise) return <View style={{ flex: 1, padding: 24 }}><Text>No exercises.</Text></View>;

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontWeight: '800' }}>Hearts: {hearts}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800' }}>{exercise.prompt}</Text>
      {exercise.kind === 'chooseMeaning' ? (
        <View style={{ gap: 8 }}>
          {(exercise.options ?? []).map((option, idx) => (
            <Pressable
              key={idx}
              onPress={() => setSelected(idx)}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selected === idx ? '#16a34a' : '#ddd',
                backgroundColor: selected === idx ? '#e8f5e9' : '#fff',
              }}
            >
              <Text>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : exercise.kind === 'typeTranslation' ? (
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type here"
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12 }}
        />
      ) : (
        <Text>Unsupported exercise type on mobile.</Text>
      )}
      {feedback ? <Text style={{ fontWeight: '800', color: feedback === 'Correct!' ? '#16a34a' : '#b91c1c' }}>{feedback}</Text> : null}
      <Pressable onPress={submitAnswer} style={{ backgroundColor: '#16a34a', borderRadius: 12, padding: 14, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>Check</Text>
      </Pressable>
    </View>
  );
}
