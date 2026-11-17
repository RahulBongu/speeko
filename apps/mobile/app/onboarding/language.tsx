import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { INDIAN_LOCALES, LOCALE_LABEL, type Locale } from '@speeko/core';
import { apiFetch } from '../../lib/api';
import { readOnboardingDraft, saveOnboardingDraft } from '../../lib/onboarding';
import { ENGLISH } from '../../lib/locale-meta';
import { OnboardingFrame } from '../../components/onboarding/OnboardingFrame';
import { Screen } from '../../components/Screen';
import { TactileButton } from '../../components/Tactile';
import { COLORS } from '../../lib/theme';

interface CourseEntry {
  id: string;
  title: string;
  locale: Locale;
}

const INDIAN_ORDER = INDIAN_LOCALES as readonly Locale[];

function toStarterOptions(entries: CourseEntry[]): CourseEntry[] {
  return entries
    .filter(
      (entry) =>
        typeof entry?.id === 'string' &&
        entry.id.endsWith('-starter') &&
        entry.id !== 'hi-pilot' &&
        (INDIAN_ORDER as readonly string[]).includes(entry.locale),
    )
    .sort(
      (a, b) => INDIAN_ORDER.indexOf(a.locale) - INDIAN_ORDER.indexOf(b.locale),
    );
}

export default function LanguageStep() {
  const router = useRouter();
  const [selected, setSelected] = useState<Locale | null>(null);
  const [courses, setCourses] = useState<CourseEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/courses');
      if (!response.ok) {
        throw new Error(`Courses could not load (${response.status}).`);
      }
      const data = await response.json();
      const entries = Array.isArray(data) ? data : data?.courses ?? [];
      setCourses(toStarterOptions(entries as CourseEntry[]));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    void readOnboardingDraft().then((draft) => {
      if (alive && draft?.locale) setSelected(draft.locale);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function choose(locale: Locale) {
    const prior = await readOnboardingDraft();
    setSelected(locale);
    await saveOnboardingDraft({ ...(prior ?? {}), locale });
    router.push('/onboarding/motivation');
  }

  if (loading && courses === null) {
    return (
      <Screen>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
          }}
        >
          <ActivityIndicator color={COLORS.green} />
          <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Loading courses…</Text>
        </View>
      </Screen>
    );
  }

  if (error && courses === null) {
    return (
      <Screen>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: 12,
            padding: 24,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.dark }}>
            Courses couldn&apos;t load
          </Text>
          <Text accessibilityRole="alert" style={{ color: COLORS.red }}>{error}</Text>
          <TactileButton label="Try again" onPress={() => void load()} />
          <TactileButton label="Back" tone="cream" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const list = courses ?? [];

  return (
    <OnboardingFrame
      step={1}
      title="Which language calls to you?"
      subtitle="Pick a course to start with. You can switch languages whenever you like."
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
        {list.map((entry) => {
          const locale = entry.locale;
          const isSelected = selected === locale;
          return (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={ENGLISH[locale]}
              accessibilityState={{ selected: isSelected }}
              onPress={() => void choose(locale)}
              style={{
                width: '47%',
                alignItems: 'center',
                gap: 6,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: isSelected ? COLORS.green : COLORS.line,
                backgroundColor: isSelected ? COLORS.greenSoft : COLORS.white,
                paddingVertical: 12,
                paddingHorizontal: 8,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.dark }}>
                {LOCALE_LABEL[locale]}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted }}>
                {ENGLISH[locale]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}
