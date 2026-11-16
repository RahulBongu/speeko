'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { OptionButton } from '@/components/onboarding/OptionButton';
import { readOnboardingDraft, saveOnboardingDraft } from '@/lib/onboarding';

const MOTIVATIONS = [
  { id: 'travel', label: 'Travel', description: 'I want to chat naturally on trips.', prefix: 'T' },
  { id: 'family', label: 'Family & friends', description: 'I want to connect with people I love.', prefix: 'F' },
  { id: 'work', label: 'Work', description: 'I want to use it on the job.', prefix: 'W' },
  { id: 'culture', label: 'Films & music', description: 'I want the stories behind the songs.', prefix: 'M' },
  { id: 'study', label: 'Study & exams', description: 'I need it on paper and in speech.', prefix: 'A1' },
  { id: 'fun', label: 'Just for fun', description: 'No reason needed — the fox will not judge.', prefix: '+' },
] as const;

export default function MotivationStep() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const draft = readOnboardingDraft();
    if (!draft?.locale) {
      router.replace('/onboarding/language');
      return;
    }
    setSelected(draft.motivation ?? null);
  }, [router]);

  function choose(motivation: string) {
    const draft = readOnboardingDraft();
    if (!draft?.locale) {
      router.replace('/onboarding/language');
      return;
    }
    setSelected(motivation);
    saveOnboardingDraft({ ...draft, motivation });
    router.push('/onboarding/level');
  }

  return (
    <OnboardingFrame
      step={2}
      title="Why are you here?"
      subtitle="This helps us choose the right starting course. Nothing leaves this browser."
      backHref="/onboarding/language"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {MOTIVATIONS.map((motivation) => (
          <OptionButton
            key={motivation.id}
            selected={selected === motivation.id}
            label={motivation.label}
            description={motivation.description}
            prefix={motivation.prefix}
            onClick={() => choose(motivation.id)}
          />
        ))}
      </div>
    </OnboardingFrame>
  );
}
