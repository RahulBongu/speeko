import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { Course } from '@speeko/core';
import { practiceOverview } from '@speeko/core';
import { apiFetch } from '../lib/api';
import { loadProgress } from '../lib/progress';
import { syncProgressIfSignedIn } from '../lib/sync';
import { AppNav } from '../components/AppNav';
import { Screen } from '../components/Screen';
import {
  SpeekoAppBar,
  TactileButton,
  TactileCard,
} from '../components/Tactile';
import { COLORS } from '../lib/theme';

export default function Practice() {
  const router = useRouter();
  const [due, setDue] = useState(0);
  const [trouble, setTrouble] = useState(0);
  const [learned, setLearned] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [nextDueAt, setNextDueAt] = useState<number | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const synced = await syncProgressIfSignedIn();
      const progress = synced.progress;
      const manifestResponse = await apiFetch('/api/courses');
      if (!manifestResponse.ok) {
        throw new Error(`Courses could not load (${manifestResponse.status}).`);
      }
      const manifest = await manifestResponse.json();
      const first = Array.isArray(manifest) ? manifest[0] : manifest?.[0];
      const id = progress.lastCourseId ?? first?.id ?? null;
      if (!id) {
        setDue(0);
        setTrouble(0);
        setLearned(0);
        setMastered(0);
        setCourseId(null);
        return;
      }
      setCourseId(id);
      const courseResponse = await apiFetch(`/api/courses/${id}`);
      if (!courseResponse.ok) {
        throw new Error(`Course could not load (${courseResponse.status}).`);
      }
      const course = (await courseResponse.json()) as Course;
      const overview = practiceOverview(course, progress);
      setDue(overview.dueCount);
      setTrouble(overview.troubleCount);
      setLearned(overview.learnedCount);
      setMastered(overview.masteredCount);
      setNextDueAt(overview.nextDueAt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load practice.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reviewing cards changes these counts; refresh whenever the screen returns
  // to the foreground instead of showing stale numbers.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && learned === 0 && !error) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Reading your review queue…</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
            Practice couldn&apos;t load
          </Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
        <AppNav active="practice" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 18, gap: 12, backgroundColor: COLORS.cream, flexGrow: 1 }}
      >
        <SpeekoAppBar subtitle="Your due review queue" />
        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Practice</Text>
        <Text style={{ color: COLORS.muted }}>
          Spaced repetition from lessons you have actually finished. Practice never awards XP and
          never unlocks unseen lessons.
        </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[
          { label: 'Due now', value: due },
          { label: 'Trouble words', value: trouble },
          { label: 'Learned', value: learned },
          { label: 'Mastered', value: mastered },
        ].map((stat) => (
          <TactileCard
            key={stat.label}
            tone="white"
            style={{ flex: 1, minWidth: 140 }}
          >
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>
              {stat.value}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.4 }}>
              {stat.label.toUpperCase()}
            </Text>
          </TactileCard>
        ))}
      </View>

      {courseId && due > 0 ? (
        <TactileButton
          label="Start due review"
          onPress={() => router.push(`/practice/${courseId}`)}
        />
      ) : (
        <TactileCard tone="white">
          <Text style={{ fontWeight: '900', color: COLORS.dark }}>
            {learned === 0 ? 'Practice unlocks after your first lesson' : 'Nothing due right now'}
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 4 }}>
            {learned === 0
              ? 'Finish a lesson and its words enter your review queue.'
              : nextDueAt
                ? `Next card is due in ${Math.max(0, Math.ceil((nextDueAt - Date.now()) / 86_400_000))} day(s).`
                : 'Open a lesson to keep learning.'}
          </Text>
        </TactileCard>
      )}

        <AppNav active="practice" />
      </ScrollView>
    </Screen>
  );
}
