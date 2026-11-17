import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { ProgressState } from '@speeko/core';
import { LOCALE_LABEL, type Locale } from '@speeko/core';
import { apiFetch } from '../lib/api';
import { loadProgress } from '../lib/progress';
import { AppNav } from '../components/AppNav';
import {
  ProgressTrack,
  SpeekoAppBar,
  TactileButton,
  TactileCard,
  TactilePressable,
} from '../components/Tactile';
import { COLORS } from '../lib/theme';

interface CourseEntry {
  id: string;
  title: string;
  locale: Locale;
  difficulty: string;
  units: number;
  lessons: number;
  exercises: number;
  reviewStatus?: 'draft' | 'reviewed';
}

const ENGLISH: Record<Locale, string> = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  mr: 'Marathi',
  te: 'Telugu',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  gu: 'Gujarati',
  pa: 'Punjabi',
  or: 'Odia',
};

function completedInCourse(progress: ProgressState | null, courseId: string): number {
  if (!progress) return 0;
  return Object.values(progress.completed).filter((record) => record.courseId === courseId).length;
}

export default function Learn() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseEntry[] | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [manifestResponse, saved] = await Promise.all([
        apiFetch('/api/courses'),
        loadProgress(),
      ]);
      if (!manifestResponse.ok) {
        throw new Error(`Courses could not load (${manifestResponse.status}).`);
      }
      const data = await manifestResponse.json();
      const entries = Array.isArray(data) ? data : data?.courses ?? [];
      setCourses(entries as CourseEntry[]);
      setProgress(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Completion badges and the continue card should reflect a lesson the
  // learner just finished, so refresh when the screen regains focus.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && courses === null) {
    return (
      <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator color={COLORS.green} />
        <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Loading courses…</Text>
      </View>
    );
  }

  if (error && courses === null) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
          Courses couldn&apos;t load
        </Text>
        <Text style={{ color: COLORS.red }}>{error}</Text>
        <TactileButton label="Try again" onPress={() => void load()} />
      </View>
    );
  }

  const list = courses ?? [];
  const lastCourse = progress?.lastCourseId
    ? list.find((entry) => entry.id === progress.lastCourseId)
    : undefined;
  const continueEntry = lastCourse ?? list[0] ?? null;
  const continueDone = continueEntry ? completedInCourse(progress, continueEntry.id) : 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, backgroundColor: COLORS.cream, flexGrow: 1 }}
    >
      <SpeekoAppBar
        subtitle="Ten Indian languages · draft review"
        streak={progress?.streak ?? 0}
        xp={progress?.xp ?? 0}
      />

      <Text style={{ fontSize: 30, fontWeight: '900', color: COLORS.dark }}>Learn</Text>
      <Text style={{ color: COLORS.muted }}>
        Three-minute lessons in ten Indian languages. Content is in draft review — lessons stay
        open, but a native speaker has not signed off yet.
      </Text>

      {continueEntry ? (
        <TactileCard tone="green">
          <Text
            style={{
              fontSize: 10,
              fontWeight: '900',
              letterSpacing: 0.8,
              color: COLORS.greenSoft,
            }}
          >
            {continueDone > 0 ? 'CONTINUE LEARNING' : 'START LEARNING'}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.white, marginTop: 2 }}>
            {ENGLISH[continueEntry.locale]}
          </Text>
          <Text style={{ color: COLORS.greenSoft, fontSize: 12, marginTop: 2 }}>
            {continueEntry.lessons} lessons · {continueEntry.exercises} exercises ·{' '}
            {continueEntry.difficulty}
          </Text>
          <View style={{ marginTop: 10 }}>
            <ProgressTrack
              value={continueEntry.lessons === 0 ? 0 : continueDone / continueEntry.lessons}
              onGreen
            />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.white, marginTop: 6 }}>
            {continueDone} of {continueEntry.lessons} lessons complete
          </Text>
          <TactileButton
            label={continueDone > 0 ? 'Continue' : 'Start learning'}
            tone="white"
            onPress={() => router.push(`/path/${continueEntry.id}`)}
            style={{ marginTop: 12, alignSelf: 'stretch' }}
          />
        </TactileCard>
      ) : null}

      <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark, marginTop: 4 }}>
        All courses
      </Text>

      {error ? (
        <Text accessibilityRole="alert" style={{ color: COLORS.red }}>
          {error}
        </Text>
      ) : null}

      {list.map((entry) => {
        const done = completedInCourse(progress, entry.id);
        const complete = done >= entry.lessons;
        return (
          <TactilePressable
            key={entry.id}
            accessibilityLabel={`${ENGLISH[entry.locale]} course, ${done} of ${entry.lessons} lessons complete`}
            onPress={() => router.push(`/path/${entry.id}`)}
            tone="white"
          >
            <View style={{ alignSelf: 'stretch', gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.dark }}>
                    {ENGLISH[entry.locale]}
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    {LOCALE_LABEL[entry.locale]} · {entry.difficulty} · {entry.lessons} lessons
                  </Text>
                </View>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: complete ? COLORS.greenDark : COLORS.line,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    backgroundColor: complete ? COLORS.greenSoft : COLORS.creamDeep,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '900',
                      color: complete ? COLORS.greenDark : COLORS.muted,
                    }}
                  >
                    {complete
                      ? 'COMPLETE'
                      : entry.reviewStatus === 'reviewed'
                        ? 'REVIEWED'
                        : 'DRAFT'}
                  </Text>
                </View>
              </View>
              <ProgressTrack
                value={entry.lessons === 0 ? 0 : done / entry.lessons}
                height={10}
              />
              <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>
                {complete ? 'Course complete' : `${done} of ${entry.lessons} lessons`}
              </Text>
            </View>
          </TactilePressable>
        );
      })}

      <Text style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
        Courses are generated from Speeko Studio. Every published lesson is currently marked draft,
        pending native-speaker review.
      </Text>

      <AppNav active="learn" />
    </ScrollView>
  );
}
