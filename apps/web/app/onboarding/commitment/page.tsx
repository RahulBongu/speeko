'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { OptionButton } from '@/components/onboarding/OptionButton';
import { completeOnboarding, readOnboardingDraft } from '@/lib/onboarding';
import { normalizeExperienceLevel } from '@speeko/core';
import { loadProgress, saveProgress, browserTimeZone } from '@/lib/progress';

const COMMITMENTS = [
  { id: 'daily', label: 'Every day', description: "I'll protect a few minutes tomorrow and today — start my first lesson now.", prefix: '24' },
  { id: 'weekdays', label: 'Weekdays', description: 'Weekends are dangerous territory — start my first lesson now.', prefix: '5/7' },
  { id: 'flexible', label: 'Whenever I can', description: 'No streak guilt; progress still counts — start my first lesson now.', prefix: '∞' },
] as const;

export default function CommitmentStep() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const draft = readOnboardingDraft();
    if (!draft?.locale) {
      router.replace('/onboarding/language');
      return;
    }
    setSelected(draft.commitment ?? null);
  }, [router]);

  function choose(commitment: string) {
    const draft = readOnboardingDraft();
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
    completeOnboarding(full);

    const timeZone = browserTimeZone();
    const current = loadProgress();
    const courseId = `${draft.locale}-starter`;
    const experience = normalizeExperienceLevel(draft.level);
    const startSuffix =
      experience === 'some'
        ? 'u3-l1'
        : experience === 'returning'
          ? 'u5-l1'
          : experience === 'conversant'
            ? 'u11-l1'
            : 'u1-l1';
    saveProgress({
      ...current,
      dailyGoal: draft.dailyGoal,
      lastCourseId: courseId,
      timeZone,
    });
    router.push(`/lesson/${courseId}/${courseId}-${startSuffix}`);
  }

  return (
    <OnboardingFrame
      step={5}
      title="How will you show up?"
      subtitle="One tap saves your plan and starts your first lesson. You can leave or switch languages any time."
      backHref="/onboarding/daily-goal"
    >
      <div className="grid gap-2">
        {COMMITMENTS.map((commitment) => (
          <OptionButton
            key={commitment.id}
            selected={selected === commitment.id}
            label={commitment.label}
            description={commitment.description}
            prefix={commitment.prefix}
            onClick={() => choose(commitment.id)}
          />
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold text-bark-400">
        No account needed — guest progress stays in this browser.
      </p>
    </OnboardingFrame>
  );
}
