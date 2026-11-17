import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import type { Course } from '@speeko/core';
import { LOCALE_LABEL, eligibleExercises, guidebookItems } from '@speeko/core';
import { apiFetch } from '../../../lib/api';
import { Screen } from '../../../components/Screen';
import {
  SpeekoAppBar,
  TactileButton,
  TactileCard,
} from '../../../components/Tactile';
import { COLORS } from '../../../lib/theme';

/** Unit guidebook: the words and exercise plan come straight from tracked course content. */
export default function Guidebook() {
  const router = useRouter();
  const { courseId, unitIndex } = useLocalSearchParams<{
    courseId: string;
    unitIndex: string;
  }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!courseId) {
      setError('This guidebook link is incomplete.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error(`The course could not load (${response.status}).`);
      }
      setCourse((await response.json()) as Course);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The course could not load.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const position = Number(unitIndex);
  const unit =
    Number.isInteger(position) && course ? course.units[position - 1] ?? null : null;

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ fontWeight: '700', color: COLORS.muted }}>Opening the guidebook…</Text>
        </View>
      </Screen>
    );
  }

  if (error || !course) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
            Couldn&apos;t open this guidebook
          </Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error ?? 'The course could not load.'}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!unit) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
            That unit does not exist
          </Text>
          <Text style={{ color: COLORS.muted }}>
            Pick a unit from the course path and try again.
          </Text>
          <TactileButton label="Back to the path" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const items = guidebookItems(unit.lessons.flatMap((lesson) => lesson.exercises));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: COLORS.cream, flexGrow: 1 }}
      >
        <SpeekoAppBar subtitle={`Unit ${position} guidebook · ${LOCALE_LABEL[course.locale]}`} />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ alignSelf: 'flex-start' }}>
        <Text style={{ fontWeight: '800', color: COLORS.muted }}>← Path</Text>
      </Pressable>

      <TactileCard tone="green">
        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: COLORS.greenSoft }}>
          UNIT {position} GUIDEBOOK
        </Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.white, marginTop: 2 }}>
          {unit.title}
        </Text>
        {unit.description ? (
          <Text style={{ fontSize: 13, color: COLORS.greenSoft, marginTop: 4 }}>
            {unit.description}
          </Text>
        ) : null}
      </TactileCard>

      <TactileCard tone="white">
        <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>
          Words and phrases in this unit
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
          These come straight from the exercises ahead — review them, then test yourself on the
          path.
        </Text>
        {items.length > 0 ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            {items.map((item) => (
              <View
                key={item.target}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  borderWidth: 2,
                  borderColor: COLORS.line,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: COLORS.cream,
                }}
              >
                <Text style={{ fontWeight: '900', color: COLORS.green, marginTop: 2 }}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: COLORS.dark }}>
                    {item.target}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.muted }}>{item.prompt}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.disabled, marginTop: 2 }}>
                    {item.kind.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: COLORS.muted, marginTop: 10 }}>
            No practice items are published for this unit yet.
          </Text>
        )}
      </TactileCard>

      <TactileCard tone="white">
        <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.dark }}>Lesson plan</Text>
        <View style={{ marginTop: 8 }}>
          {unit.lessons.map((lesson, index) => (
            <View
              key={lesson.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                paddingVertical: 10,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: COLORS.line,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: COLORS.dark }}>
                  {index + 1}. {lesson.title}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.muted }}>
                  {eligibleExercises(lesson.exercises).length} exercises · {lesson.xpReward} XP
                </Text>
              </View>
              <View
                style={{
                  borderRadius: 999,
                  backgroundColor: COLORS.greenSoft,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '900', color: COLORS.greenDark }}>
                  LESSON
                </Text>
              </View>
            </View>
          ))}
        </View>
      </TactileCard>
      </ScrollView>
    </Screen>
  );
}
