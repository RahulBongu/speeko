'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { COURSE_ORDER, LOCALE_META } from '@/lib/courses';
import { readOnboardingDraft, saveOnboardingDraft } from '@/lib/onboarding';
import type { Locale } from '@speeko/core';

export default function LanguageStep() {
  const router = useRouter();
  const [selected, setSelected] = useState<Locale | null>(null);

  useEffect(() => {
    const draft = readOnboardingDraft();
    if (draft?.locale) setSelected(draft.locale);
  }, []);

  function choose(locale: Locale) {
    const prior = readOnboardingDraft();
    setSelected(locale);
    saveOnboardingDraft({ ...prior, locale });
    router.push('/onboarding/motivation');
  }

  return (
    <OnboardingFrame
      step={1}
      title="Which language calls to you?"
      subtitle="Pick a course to start with. You can switch languages whenever you like."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2">
        {COURSE_ORDER.map((locale) => {
          const meta = LOCALE_META[locale];
          const isSelected = selected === locale;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => choose(locale)}
              aria-pressed={isSelected}
              className={`focus-ring group flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition duration-200 sm:p-3 ${
                isSelected
                  ? 'border-speeko-400 bg-speeko-50 shadow-card-sm'
                  : 'border-cream-200 bg-white hover:border-speeko-300 hover:bg-cream-50'
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-xl text-white sm:h-14 sm:w-14 sm:text-2xl ${meta.gradient}`}
              >
                <span className="script-text font-extrabold">{meta.glyph}</span>
              </span>
              <span className="text-center">
                <span className="script-text block font-display text-xs font-extrabold leading-tight text-bark-800 sm:text-sm">
                  {meta.native}
                </span>
                <span className="mt-0.5 block text-[10px] font-bold text-bark-400 sm:text-[11px]">
                  {meta.english}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </OnboardingFrame>
  );
}
