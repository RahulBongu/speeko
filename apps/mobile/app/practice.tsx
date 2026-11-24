import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { Course } from '@speeko/core';
import { practiceOverview } from '@speeko/core';
import { apiFetch } from '../lib/api';
import { syncProgressIfSignedIn } from '../lib/sync';
import { AppNav } from '../components/AppNav';
import { Screen } from '../components/Screen';
import { Fox } from '../components/Fox';
import { Icon } from '../components/Icons';
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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && learned === 0 && !error) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Reading your review queue…</Text>
        </View>
        <AppNav active="practice" />
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

  const hasQueue = learned > 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: COLORS.cream, flexGrow: 1 }}>
        <SpeekoAppBar subtitle="Spaced repetition" />
        <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>Practice</Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18 }}>
          Short reviews from lessons you actually finished. Practice never awards XP and never unlocks
          unseen lessons.
        </Text>

        <TactileCard tone={due > 0 ? 'green' : 'white'}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '900',
                  letterSpacing: 0.8,
                  color: due > 0 ? COLORS.greenSoft : COLORS.muted,
                }}
              >
                {due > 0 ? 'READY FOR YOU' : 'YOUR REVIEW QUEUE'}
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  color: due > 0 ? COLORS.white : COLORS.dark,
                  marginTop: 2,
                }}
              >
                {due > 0 ? `${due} word${due === 1 ? '' : 's'} due` : hasQueue ? 'All caught up' : 'Nothing due yet'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: due > 0 ? COLORS.greenSoft : COLORS.muted,
                  marginTop: 2,
                }}
              >
                {due > 0
                  ? 'Quick recall keeps your memory strong.'
                  : hasQueue
                    ? nextDueAt
                      ? `Next card in ${Math.max(0, Math.ceil((nextDueAt - Date.now()) / 86_400_000))} day(s).`
                      : 'No reviews due right now.'
                    : 'Finish a lesson to add words here.'}
              </Text>
            </View>
            <Fox
              mood={due > 0 ? 'happy' : 'idle'}
              style={{ width: 84, height: 84 }}
              title="Speeko, ready to practice"
            />
          </View>
          {due > 0 && courseId ? (
            <TactileButton
              label="Start due review"
              tone="white"
              onPress={() => router.push(`/practice/${courseId}`)}
              style={{ marginTop: 12, alignSelf: 'stretch' }}
            />
          ) : null}
        </TactileCard>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Due now', value: due },
            { label: 'Trouble words', value: trouble },
            { label: 'Learned', value: learned },
            { label: 'Mastered', value: mastered },
          ].map((stat) => (
            <TactileCard key={stat.label} tone="white" style={{ flex: 1, minWidth: 140 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.dark }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.muted, letterSpacing: 0.4 }}>
                {stat.label.toUpperCase()}
              </Text>
            </TactileCard>
          ))}
        </View>

        {courseId ? (
          <TactileButton
            label="Practice this course"
            tone="white"
            onPress={() => router.push(`/practice/${courseId}`)}
          />
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="practice" size={16} color={COLORS.muted} />
          <Text style={{ flex: 1, fontSize: 11, color: COLORS.muted }}>
            Spaced repetition moves each reviewed word through its own box. Trouble words stay in
            rotation until you get them right.
          </Text>
        </View>

        <AppNav active="practice" />
      </ScrollView>
    </Screen>
  );
}
