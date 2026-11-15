'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { levelForXp } from '@speeko/core';
import { Brand, StatPill } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { ProgressBar } from '@/components/ProgressBar';
import { ArrowRightIcon, BoltIcon, FlameIcon, StarIcon } from '@/components/icons';
import { COURSE_ORDER, LOCALE_META } from '@/lib/courses';
import { DAILY_GOAL } from '@/lib/progress';
import { readCompletedOnboarding } from '@/lib/onboarding';
import { useProgress } from '@/lib/use-progress';

const FEATURES = [
  {
    title: 'Three-minute lessons',
    body: 'Bite-size exercises that fit between chai and the next meeting. Ten question types, zero fluff.',
    icon: <BoltIcon className="h-5 w-5" />,
    tone: 'bg-[#fff9e0] text-[#a06b00]',
  },
  {
    title: 'A streak worth keeping',
    body: 'Daily goals, XP, combos and hearts keep the habit gentle but real. Miss a day? Start again without shame.',
    icon: <FlameIcon className="h-5 w-5" />,
    tone: 'bg-[#fff1e8] text-fox-700',
  },
  {
    title: 'Ten scripts, one fox',
    body: 'Devanagari to Gurmukhi, with audio, typing and speaking practice built in — not bolted on.',
    icon: <StarIcon className="h-5 w-5" />,
    tone: 'bg-speeko-50 text-speeko-700',
  },
];

const FLOATING_WORDS = [
  { text: 'नमस्ते', className: '-left-7 top-10 -rotate-6', delay: '0s' },
  { text: 'வணக்கம்', className: '-right-8 top-20 rotate-6', delay: '1.2s' },
  { text: 'নমস্কার', className: '-left-4 bottom-12 rotate-3', delay: '2.1s' },
  { text: 'నమస్తే', className: '-right-5 bottom-6 -rotate-3', delay: '0.6s' },
];

export default function HomePage() {
  const progress = useProgress();
  const [onboardingDone, setOnboardingDone] = useState(false);
  useEffect(() => {
    setOnboardingDone(Boolean(readCompletedOnboarding()));
  }, []);
  const started = Boolean(progress && progress.xp > 0);
  const todayXp = progress?.todayXp ?? 0;
  const continueHref =
    started && progress?.lastCourseId
      ? `/learn/${progress.lastCourseId}`
      : !started && onboardingDone && progress?.lastCourseId
        ? `/learn/${progress.lastCourseId}`
        : '/onboarding';

  return (
    <div className="overflow-x-hidden">
      <div className="relative">
        <div aria-hidden="true" className="hero-dots absolute inset-0 opacity-70" />
        <div
          aria-hidden="true"
          className="hero-glow absolute left-1/2 top-8 h-[420px] w-[720px] -translate-x-1/2 opacity-70"
        />
        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-5">
          <header className="flex items-center justify-between gap-3">
            <Brand />
            <nav className="flex items-center gap-1" aria-label="Main">
              <Link href="/learn" className="btn-ghost">
                Courses
              </Link>
              <Link href="/studio" className="btn-ghost hidden sm:inline-flex">
                Studio
              </Link>
            </nav>
          </header>

          <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
            <div className="animate-rise [animation-delay:80ms]">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-speeko-200 bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-speeko-700 shadow-card-sm">
                <span className="h-2 w-2 rounded-full bg-speeko-500" />
                10 Indian languages · free to start
              </span>

              <h1 className="mt-5 font-display text-[2.9rem] font-extrabold leading-[1.02] tracking-tight text-bark-800 sm:text-6xl">
                Speak a little more,{' '}
                <span className="relative whitespace-nowrap text-speeko-600">
                  every day.
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 12"
                    className="absolute -bottom-1 left-0 h-3 w-full text-fox-400"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9C48 3 98 2 152 5c24 1 46 3 66 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg font-semibold leading-relaxed text-bark-500">
                Speeko turns three-minute lessons into real conversations — with streaks, hearts,
                and a fox who genuinely believes in you. Start with Hindi, Tamil, Bengali, or seven
                more.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row animate-rise [animation-delay:160ms]">
                <Link href={continueHref} className="btn-primary btn-shine px-7 py-4 text-base active:scale-[0.97]">
                  {started ? 'Continue learning' : 'Start learning'}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href="/learn" className="btn-secondary px-6 py-4 text-base">
                  Browse languages
                </Link>
              </div>

              {started ? (
                <>
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <StatPill
                      icon={<FlameIcon className="h-4 w-4" />}
                      value={`${progress?.streak ?? 0} day${progress?.streak === 1 ? '' : 's'}`}
                      label="Streak"
                      tone="streak"
                    />
                    <StatPill
                      icon={<BoltIcon className="h-4 w-4" />}
                      value={`${progress?.xp ?? 0} XP`}
                      label="Total XP"
                      tone="xp"
                    />
                    <StatPill
                      icon={<StarIcon className="h-4 w-4" />}
                      value={`Level ${levelForXp(progress?.xp ?? 0)}`}
                      label="Level"
                      tone="default"
                    />
                  </div>
                  <div className="mt-4 max-w-md rounded-2xl border-2 border-cream-200 bg-white p-4 shadow-card-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-bark-400">
                        Today&apos;s goal
                      </p>
                      <p className="font-display text-xs font-extrabold text-bark-600">
                        {Math.min(todayXp, DAILY_GOAL)} / {DAILY_GOAL} XP
                      </p>
                    </div>
                    <ProgressBar
                      value={Math.min(1, todayXp / DAILY_GOAL)}
                      className="mt-2 h-2.5"
                      barClassName="bg-speeko-400"
                      label="Daily XP goal"
                    />
                  </div>
                </>
              ) : (
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-bark-300">
                  No sign-up needed — progress saves in this browser
                </p>
              )}
            </div>

            <div className="relative mx-auto w-full max-w-sm pb-6 pt-2 animate-rise [animation-delay:240ms]">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-speeko-200/50 blur-2xl"
              />
              <div className="relative mx-auto flex h-[296px] w-[296px] items-center justify-center rounded-[3rem] border-2 border-cream-200 bg-white shadow-card">
                <div className="absolute inset-4 rounded-[2.4rem] bg-gradient-to-br from-speeko-50 via-cream-50 to-fox-100" />
                <Fox mood="happy" className="relative h-[268px] w-[268px] animate-bob" />
              </div>

              {FLOATING_WORDS.map((word) => (
                <span
                  key={word.text}
                  aria-hidden="true"
                  style={{ animationDelay: word.delay }}
                  className={`script-text absolute animate-float rounded-2xl border-2 border-cream-200 bg-white px-3 py-1.5 font-display text-sm font-extrabold text-bark-500 shadow-card-sm ${word.className}`}
                >
                  {word.text}
                </span>
              ))}

              <div className="absolute -bottom-1 left-1/2 w-max -translate-x-1/2 rounded-2xl border-2 border-cream-200 bg-white px-4 py-2 text-center shadow-card-sm">
                <p className="font-display text-xs font-extrabold text-bark-600">
                  “Namaste! Ready for lesson one?”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-5 pb-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="card p-5">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${feature.tone}`}
              >
                {feature.icon}
              </span>
              <h2 className="mt-3 font-display text-lg font-extrabold text-bark-800">
                {feature.title}
              </h2>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-bark-500">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-cream-200 bg-white/70">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-speeko-600">
                Choose your script
              </p>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-bark-800">
                Pick a language
              </h2>
            </div>
            <Link
              href="/learn"
              className="focus-ring flex items-center gap-1.5 rounded-xl px-2 py-1 font-display text-sm font-extrabold text-speeko-700 hover:bg-speeko-50"
            >
              All courses <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {COURSE_ORDER.map((locale) => {
              const meta = LOCALE_META[locale];
              return (
                <Link
                  key={locale}
                  href={`/learn/${locale}-starter`}
                  className="focus-ring group flex items-center gap-3 rounded-2xl border-2 border-cream-200 bg-white p-3 shadow-card-sm transition duration-200 hover:-translate-y-0.5 hover:border-speeko-300 hover:shadow-card"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${meta.gradient}`}
                  >
                    <span className="script-text text-xl font-extrabold">{meta.glyph}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="script-text block truncate font-display text-sm font-extrabold text-bark-800">
                      {meta.native}
                    </span>
                    <span className="block truncate text-[11px] font-bold text-bark-400">
                      {meta.english}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-speeko-600 px-6 py-10 text-white shadow-card sm:px-10">
          <div aria-hidden="true" className="hero-dots absolute inset-0 opacity-10" />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Your first word is one tap away.
              </h2>
              <p className="mt-2 text-sm font-semibold text-white/85">
                Pick a course, keep a streak, and let the fox handle the encouragement. Everything
                you need is already here.
              </p>
            </div>
            <Link
              href={continueHref}
              className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-display text-sm font-extrabold uppercase tracking-wide text-speeko-700 shadow-[0_4px_0_#d6eccb] transition hover:bg-cream-50 active:translate-y-[3px] active:shadow-none"
            >
              {started ? 'Keep going' : 'Start learning'}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <Fox
            mood="celebrate"
            className="pointer-events-none absolute -bottom-8 right-6 hidden h-40 w-40 opacity-95 lg:block"
          />
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 pb-10">
        <div className="flex flex-col gap-5 border-t border-cream-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p className="max-w-sm text-xs font-semibold leading-relaxed text-bark-400">
            Original lessons, original characters. Speeko is an independent project and is not
            affiliated with any other language-learning app.
          </p>
          <nav className="flex items-center gap-3" aria-label="Footer">
            <Link href="/learn" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Learn
            </Link>
            <Link href="/studio" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Studio
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
