'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DAILY_GOAL_OPTIONS } from '@/lib/progress';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { OptionButton } from '@/components/onboarding/OptionButton';
import { readOnboardingDraft, saveOnboardingDraft } from '@/lib/onboarding';

const GOAL_COPY: Record<number, { label: string; description: string }> = {
  10: { label: 'Casual · 10 XP', description: 'A few minutes whenever you can.' },
  30: { label: 'Light · 30 XP', description: 'One lesson most days.' },
  50: { label: 'Regular · 50 XP', description: 'The recommended daily habit.' },
  80: { label: 'Serious · 80 XP', description: 'A short lesson plus review.' },
  120: { label: 'Committed · 120 XP', description: 'You came here to work.' },
};

const GOALS = DAILY_GOAL_OPTIONS.map((xp) => ({
  xp,
  label: GOAL_COPY[xp]?.label ?? `${xp} XP`,
  description: GOAL_COPY[xp]?.description ?? 'A steady daily target.',
}));

export default function DailyGoalStep() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const draft = readOnboardingDraft();
    if (!draft?.locale) {
      router.replace('/onboarding/language');
      return;
    }
    setSelected(draft.dailyGoal ?? null);
  }, [router]);

  function choose(dailyGoal: number) {
    const draft = readOnboardingDraft();
    if (!draft?.locale) {
      router.replace('/onboarding/language');
      return;
    }
    setSelected(dailyGoal);
    saveOnboardingDraft({ ...draft, dailyGoal });
    router.push('/onboarding/commitment');
  }

  return (
    <OnboardingFrame
      step={4}
      title="Set a daily goal"
      subtitle="You can change this any time. The goal is motivation, not a scoreboard."
      backHref="/onboarding/level"
    >
      <div className="grid gap-2">
        {GOALS.map((goal) => (
          <OptionButton
            key={goal.xp}
            selected={selected === goal.xp}
            label={goal.label}
            description={goal.description}
            prefix={String(goal.xp)}
            onClick={() => choose(goal.xp)}
          />
        ))}
      </div>
    </OnboardingFrame>
  );
}
