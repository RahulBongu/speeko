import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { browserTimeZone } from '@speeko/core';
import { completeOnboarding, readOnboardingDraft } from '../../lib/onboarding';
import { loadProgress, saveProgress } from '../../lib/progress';
import { OnboardingFrame } from '../../components/onboarding/OnboardingFrame';
import { OptionButton } from '../../components/onboarding/OptionButton';
import { COLORS } from '../../lib/theme';

const COMMITMENTS = [
  { id: 'daily', label: 'Every day', description: "I'll protect a few minutes tomorrow and today — start my first lesson now.", prefix: '24' },
  { id: 'weekdays', label: 'Weekdays', description: 'Weekends are dangerous territory — start my first lesson now.', prefix: '5/7' },
  { id: 'flexible', label: 'Whenever I can', description: 'No streak guilt; progress still counts — start my first lesson now.', prefix: '∞' },
] as const;

export default function CommitmentStep() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void readOnboardingDraft().then((draft) => {
      if (!alive) return;
      if (!draft?.locale) {
        router.replace('/onboarding/language');
        return;
      }
      setSelected(draft.commitment ?? null);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  async function choose(commitment: string) {
    const draft = await readOnboardingDraft();
    if (
      !draft?.locale ||
      !draft.motivation ||
      !draft.level ||
      typeof draft.dailyGoal !== 'number'
    ) {
      router.replace('/onboarding/language');
      return;
    }
    const full = {
      ...draft,
      commitment,
    } as typeof draft & {
      motivation: string;
      level: string;
      dailyGoal: number;
      commitment: string;
    };
    setSelected(commitment);
    await completeOnboarding(full);

    const current = await loadProgress();
    const timeZone = browserTimeZone() ?? current.timeZone ?? null;
    const courseId = `${draft.locale}-starter`;
    await saveProgress({
      ...current,
      dailyGoal: draft.dailyGoal,
      lastCourseId: courseId,
      timeZone,
    });
    // Guest semantics: progress stays on this device, so we deliberately do
    // not call syncProgress() here — the account merge happens at sign-in.
    router.push(`/lesson/${courseId}/${courseId}-u1-l1`);
  }

  return (
    <OnboardingFrame
      step={5}
      title="How will you show up?"
      subtitle="One tap saves your plan and starts your first lesson. You can leave or switch languages any time."
      backHref="/onboarding/daily-goal"
    >
      <View style={{ gap: 10 }}>
        {COMMITMENTS.map((commitment) => (
          <OptionButton
            key={commitment.id}
            selected={selected === commitment.id}
            label={commitment.label}
            description={commitment.description}
            prefix={commitment.prefix}
            onPress={() => void choose(commitment.id)}
          />
        ))}
      </View>
      <Text style={{ marginTop: 14, fontSize: 11, fontWeight: '700', color: COLORS.muted }}>
        No account needed — guest progress stays on this device.
      </Text>
    </OnboardingFrame>
  );
}
