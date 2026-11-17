import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { readOnboardingDraft, saveOnboardingDraft } from '../../lib/onboarding';
import { OnboardingFrame } from '../../components/onboarding/OnboardingFrame';
import { OptionButton } from '../../components/onboarding/OptionButton';

const LEVELS = [
  { id: 'zero', label: "I'm starting from zero", description: 'I can barely recognize the script.', prefix: '0' },
  { id: 'some', label: 'I know a little', description: 'I can say hello and a few phrases.', prefix: '1' },
  { id: 'returning', label: 'I learned this before', description: 'Time to rebuild what school or family gave me.', prefix: '2' },
  { id: 'conversant', label: 'I can hold simple chats', description: 'Let’s start with the foundations — you can breeze through.', prefix: '3' },
] as const;

export default function LevelStep() {
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
      setSelected(draft.level ?? null);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  async function choose(level: string) {
    const draft = await readOnboardingDraft();
    if (!draft?.locale) {
      router.replace('/onboarding/language');
      return;
    }
    setSelected(level);
    await saveOnboardingDraft({ ...draft, level });
    router.push('/onboarding/daily-goal');
  }

  return (
    <OnboardingFrame
      step={3}
      title="How much do you already know?"
      subtitle="Honest answers help us set the tone. You can always move faster or slower later."
      backHref="/onboarding/motivation"
    >
      <View style={{ gap: 10 }}>
        {LEVELS.map((level) => (
          <OptionButton
            key={level.id}
            selected={selected === level.id}
            label={level.label}
            description={level.description}
            prefix={level.prefix}
            onPress={() => void choose(level.id)}
          />
        ))}
      </View>
    </OnboardingFrame>
  );
}
