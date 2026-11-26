'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { levelForXp, type Locale, type MascotReactionId } from '@speeko/core';
import { Brand, StatPill } from '@/components/AppHeader';
import { Fox, type FoxMood } from '@/components/Fox';
import { ProgressBar } from '@/components/ProgressBar';
import {
  ArrowRightIcon,
  BoltIcon,
  BookOpenIcon,
  CheckIcon,
  FlameIcon,
  RefreshIcon,
  SpeakerIcon,
  StarIcon,
  TrophyIcon,
  XIcon,
} from '@/components/icons';
import { COURSE_ORDER, LOCALE_META } from '@/lib/courses';
import { DAILY_GOAL } from '@/lib/progress';
import { readCompletedOnboarding } from '@/lib/onboarding';
import { useProgress } from '@/lib/use-progress';
import { nextVariedMascotReaction, playMascotVoice, useMascotSpeaking } from '@/lib/mascotVoice';

const FEATURES = [
  {
    title: 'Three-minute lessons',
    body: 'Bite-size exercises that fit between chai and the next meeting. Nine exercise types, zero fluff.',
    icon: <BoltIcon className="h-5 w-5" />,
    tone: 'bg-gold-100 text-gold-700',
  },
  {
    title: 'A streak worth keeping',
    body: 'Daily goals, XP, combos and hearts keep the habit gentle but real. Miss a day? Start again without shame.',
    icon: <FlameIcon className="h-5 w-5" />,
    tone: 'bg-fox-100 text-fox-700',
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

const GREETINGS: Record<Locale, { text: string; reading: string }> = {
  en: { text: 'Hello', reading: 'hello' },
  hi: { text: 'नमस्ते', reading: 'namaste' },
  bn: { text: 'হ্যালো', reading: 'hyalo' },
  mr: { text: 'नमस्कार', reading: 'namaskar' },
  te: { text: 'నమస్కారం', reading: 'namaskaram' },
  ta: { text: 'வணக்கம்', reading: 'vanakkam' },
  kn: { text: 'ನಮಸ್ಕಾರ', reading: 'namaskara' },
  ml: { text: 'നമസ്കാരം', reading: 'namaskaram' },
  gu: { text: 'નમસ્તે', reading: 'namaste' },
  pa: { text: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', reading: 'sat sri akaal' },
  or: { text: 'ନମସ୍କାର', reading: 'namaskara' },
};

const STEPS = [
  {
    title: 'Pick a script',
    body: 'Ten Indian languages, each with its own script and romanized readings. Start anywhere.',
    icon: <BookOpenIcon className="h-5 w-5" />,
  },
  {
    title: 'Learn in tiny bursts',
    body: 'Two to four short exercises per lesson: hear it or see it, then choose or type the answer. Roughly three minutes.',
    icon: <BoltIcon className="h-5 w-5" />,
  },
  {
    title: 'Follow the trail',
    body: 'Glide smoothly from Unit 1 through every module. Finish the glowing lesson to unlock the next.',
    icon: <TrophyIcon className="h-5 w-5" />,
  },
];

const VOICE_DEMOS: Array<{
  id: MascotReactionId;
  label: string;
  line: string;
  mood: FoxMood;
}> = [
  { id: 'correct_answer', label: 'Cheer me on', line: 'Hurray! You did it!', mood: 'correct_answer' },
  {
    id: 'encouragement',
    label: 'Pick me up',
    line: "Let's figure it out together.",
    mood: 'encouragement',
  },
  { id: 'lesson_complete', label: 'Celebrate', line: 'Amazing work!', mood: 'victory_dance' },
  {
    id: 'discovery',
    label: 'Surprise me',
    line: 'Ooh, let us learn something new!',
    mood: 'curious_discovery',
  },
];

const SAMPLE_QUESTION = {
  course: 'Hindi',
  prompt: 'Which one means “Hello”?',
  options: ['नमस्ते', 'धन्यवाद', 'हाँ', 'ना'],
  answer: 0,
  reading: 'namaste',
  explanation: 'नमस्ते (namaste) is the all-purpose Hindi greeting — hello and goodbye.',
};

const FAQ = [
  {
    question: 'Is Speeko free?',
    answer:
      'Yes. Every lesson on every path is free to play. Gems you earn from lessons can buy optional fox cosmetics and streak freezes — nothing in the learning path is paywalled.',
  },
  {
    question: 'Do I need a Hindi or Tamil keyboard?',
    answer:
      'No. Typing exercises accept the native script or a romanized answer such as “namaste”. Tap “Show letters” if you want the English spelling while you type.',
  },
  {
    question: 'How long does a lesson take?',
    answer:
      'Most lessons are two to four short exercises, so they fit in about three minutes. Most starter units hold two lessons; the Hindi pilot goes deeper with five per unit.',
  },
  {
    question: 'Does my progress save?',
    answer:
      'Yes — in this browser, with no account needed. Sign in if you want the same progress snapshot synced through the API.',
  },
  {
    question: 'Who checked the translations?',
    answer:
      'Every course carries a review status. The current lessons are original and automatically checked for structure, script and audio problems; they are not yet certified by native speakers.',
  },
  {
    question: 'Can I mute the fox?',
    answer:
      'Yes. Account → Mascot voice turns the six reaction lines off while keeping the animations. Lesson sound effects have their own toggle in the lesson header.',
  },
];


export default function HomePage() {
  const progress = useProgress();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const mascotSpeaking = useMascotSpeaking();
  const [mascotMood, setMascotMood] = useState<FoxMood>('idle');
  const [mascotLine, setMascotLine] = useState<string | null>(null);
  const [samplePick, setSamplePick] = useState<number | null>(null);
  const demoTimer = useRef<number | null>(null);

  useEffect(() => {
    setOnboardingDone(Boolean(readCompletedOnboarding()));
  }, []);

  useEffect(
    () => () => {
      if (demoTimer.current !== null) window.clearTimeout(demoTimer.current);
    },
    [],
  );

  function playDemo(demo: (typeof VOICE_DEMOS)[number]) {
    const pick = nextVariedMascotReaction(demo.id);
    setMascotLine(pick.phrase || demo.line);
    setMascotMood(demo.mood);
    playMascotVoice(demo.id, pick.audioKey);
    if (demoTimer.current !== null) window.clearTimeout(demoTimer.current);
    demoTimer.current = window.setTimeout(() => setMascotMood('idle'), 2600);
  }

  const started = Boolean(progress && progress.xp > 0);
  const todayXp = progress?.todayXp ?? 0;
  const dailyGoal = progress?.dailyGoal ?? DAILY_GOAL;
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
                  <Link
                    href="/habits"
                    className="focus-ring group mt-4 block max-w-md rounded-2xl border-2 border-cream-200 bg-white p-4 shadow-card-sm transition hover:border-speeko-200 hover:shadow-card"
                    aria-label="Habits — daily goal and streak calendar"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
                        Today&apos;s goal
                      </p>
                      <p className="font-display text-xs font-extrabold text-bark-600">
                        {Math.min(todayXp, dailyGoal)} / {dailyGoal} XP
                      </p>
                    </div>
                    <ProgressBar
                      value={Math.min(1, todayXp / dailyGoal)}
                      className="mt-2 h-2.5"
                      barClassName="bg-speeko-400"
                      label="Daily XP goal"
                    />
                    <span className="eyebrow mt-2 flex items-center gap-1">
                      Habits
                      <ArrowRightIcon className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </>
              ) : (
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-bark-500">
                  No sign-up needed — progress saves in this browser
                </p>
              )}
            </div>

            <div className="relative mx-auto w-full max-w-sm pb-6 pt-2 animate-rise [animation-delay:240ms]">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-speeko-200/50 blur-2xl"
              />
              <div className="relative mx-auto flex h-[296px] w-[296px] items-center justify-center rounded-[3rem] border-2 border-cream-200 bg-white shadow-card md:h-[344px] md:w-[344px]">
                <div className="absolute inset-4 rounded-[2.4rem] bg-gradient-to-br from-speeko-50 via-cream-50 to-fox-100" />
                <Fox
                  mood={started ? 'welcome_back' : 'greeting'}
                  accessory={progress?.equippedCosmetic ?? null}
                  patrol
                  onTap={() => {
                    const pick = nextVariedMascotReaction('correct_answer');
                    playMascotVoice('correct_answer', pick.audioKey);
                  }}
                  className="relative h-[268px] w-[268px] md:h-[316px] md:w-[316px]"
                />
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

      <section aria-label="Speeko at a glance" className="border-y border-cream-200 bg-white/70">
        <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-y-4 px-5 py-6 sm:grid-cols-4">
          {[
            ['10', 'Indian languages'],
            ['118', 'modules to climb'],
            ['880', 'exercises'],
            ['3 min', 'per lesson'],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <dt className="sr-only">{label}</dt>
              <dd className="font-display text-2xl font-extrabold text-bark-800">{value}</dd>
              <dd className="text-[11px] font-bold uppercase tracking-[0.12em] text-bark-400">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-14 pt-10">
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

      <section className="mx-auto max-w-5xl px-5 pb-14">
        <div className="rounded-[2rem] border-2 border-cream-200 bg-white/80 p-6 shadow-card-sm sm:p-8">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-bark-800">
              Three minutes up the path.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-bark-500">
              Speeko keeps the loop small on purpose: notice a word, use it, and meet it again later.
            </p>
          </div>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border-2 border-cream-100 bg-cream-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-speeko-700 shadow-card-sm">
                    {step.icon}
                  </span>
                  <span className="font-display text-2xl font-extrabold text-bark-300">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-extrabold text-bark-800">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-bark-500">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/learn" className="btn-secondary w-fit">
              See the course map
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <p className="text-xs font-semibold text-bark-400">
              Modules connect step by step on one winding Duolingo-style trail.
            </p>
          </div>
        </div>
      </section>

      <section id="languages" className="border-y border-cream-200 bg-white/70">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">
                Choose your script
              </p>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-bark-800">
                Say hello in ten scripts.
              </h2>
              <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-bark-500">
                Same hello, ten writing systems. Open any card to start that course — an English
                keyboard is enough.
              </p>
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
              const greeting = GREETINGS[locale];
              return (
                <Link
                  key={locale}
                  href={`/learn/${locale}-starter`}
                  className="focus-ring group flex flex-col gap-2 rounded-2xl border-2 border-cream-200 bg-white p-3.5 shadow-card-sm transition duration-200 hover:-translate-y-0.5 hover:border-speeko-300 hover:shadow-card"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${meta.gradient}`}
                    >
                      <span className="script-text text-lg font-extrabold">{meta.glyph}</span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 text-bark-300 transition group-hover:translate-x-0.5 group-hover:text-speeko-600" />
                  </span>
                  <span className="script-text font-display text-xl font-extrabold leading-snug text-bark-800">
                    {greeting.text}
                  </span>
                  <span className="text-xs font-bold text-bark-400">{greeting.reading}</span>
                  <span className="mt-auto pt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-bark-500">
                    {meta.english}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative mx-auto w-full max-w-xs">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fox-200/50 blur-2xl"
            />
            <div className="relative flex h-64 w-full items-center justify-center rounded-[2.5rem] border-2 border-cream-200 bg-white shadow-card md:h-72">
              <div
                aria-hidden="true"
                className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-fox-100 via-cream-50 to-speeko-50"
              />
              <Fox
                mood={mascotMood}
                accessory={progress?.equippedCosmetic ?? null}
                patrol
                speaking={mascotSpeaking}
                className="relative h-56 w-56 md:h-64 md:w-64"
              />
            </div>
          </div>

          <div>
            <p className="eyebrow">Meet Speeko</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-bark-800 sm:text-4xl">
              The fox has a voice.
            </h2>
            <p className="mt-2 max-w-lg text-sm font-semibold leading-relaxed text-bark-500">
              Thirty-three varied reaction voice clips are bundled offline with Speeko. Tap any button —
              even twice in a row — to hear different cheers and watch the ears, arms, tail and
              jumps respond.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {VOICE_DEMOS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => playDemo(demo)}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border-2 border-cream-200 bg-white px-3.5 py-2 font-display text-sm font-extrabold text-bark-700 shadow-card-sm transition hover:border-speeko-300 hover:text-speeko-700 active:translate-y-px"
                >
                  <SpeakerIcon className="h-4 w-4 text-speeko-600" />
                  {demo.label}
                </button>
              ))}
            </div>

            <div
              aria-live="polite"
              className="mt-4 flex min-h-[3.75rem] items-center rounded-2xl border-2 border-dashed border-cream-300 bg-white/80 px-4 py-3"
            >
              <p className="font-display text-base font-extrabold text-bark-700">
                {mascotLine ?? 'Tap a reaction to wake the fox.'}
              </p>
            </div>
            <p className="mt-2 text-xs font-semibold text-bark-400">
              Muted the mascot in Account? The animations still play; the clips stay silent.
            </p>
          </div>
        </div>
      </section>

      <section id="try" className="border-y border-cream-200 bg-white/70">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Try a real question</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-bark-800">
              Three seconds. No account.
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-bark-500">
              This is the first exercise from the Hindi starter course — not a mock-up. Pick the
              word that means “hello”, then open the lesson to keep going.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/lesson/hi-starter/hi-starter-u1-l1" className="btn-primary">
                Open lesson one
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/learn/hi-starter" className="btn-secondary">
                See the Hindi path
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
              Hindi · Greetings
            </p>
            <h3 className="mt-1 font-display text-xl font-extrabold text-bark-800">
              {SAMPLE_QUESTION.prompt}
            </h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2" role="group" aria-label="Answer choices">
              {SAMPLE_QUESTION.options.map((option, index) => {
                const answered = samplePick !== null;
                const isCorrect = index === SAMPLE_QUESTION.answer;
                const isChosen = samplePick === index;
                const tone = !answered
                  ? 'border-cream-200 bg-white text-bark-700 hover:border-speeko-300 hover:bg-cream-50'
                  : isCorrect
                    ? 'border-speeko-500 bg-speeko-50 text-speeko-800'
                    : isChosen
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-cream-200 bg-white text-bark-400';
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={answered}
                    aria-pressed={isChosen}
                    onClick={() => setSamplePick(index)}
                    className={`focus-ring flex items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left font-display text-lg font-extrabold shadow-card-sm transition disabled:cursor-default ${tone}`}
                  >
                    <span className="script-text" lang="hi">
                      {option}
                    </span>
                    {answered && isCorrect ? <CheckIcon className="h-4 w-4 shrink-0" /> : null}
                    {answered && isChosen && !isCorrect ? (
                      <XIcon className="h-4 w-4 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div aria-live="polite" className="mt-3 min-h-[3.5rem]">
              {samplePick === null ? (
                <p className="text-sm font-semibold text-bark-400">Pick an answer to check it.</p>
              ) : samplePick === SAMPLE_QUESTION.answer ? (
                <p className="text-sm font-semibold text-speeko-800">
                  {SAMPLE_QUESTION.explanation} Read it as “{SAMPLE_QUESTION.reading}”.
                </p>
              ) : (
                <p className="text-sm font-semibold text-bark-600">
                  Not quite — नमस्ते is the greeting. It reads “{SAMPLE_QUESTION.reading}”.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Beyond the path</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-bark-800">
              Built to stick.
            </h2>
          </div>
          <p className="max-w-sm text-sm font-semibold leading-relaxed text-bark-500">
            Speeko keeps the daily loop alive after the lesson ends.
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Link
            href="/practice"
            className="focus-ring card p-5 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <RefreshIcon className="h-6 w-6 text-speeko-600" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-bark-800">Practice</h3>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-bark-500">
              Short spaced-repetition sets pull out your weakest words between lessons.
            </p>
          </Link>
          <Link
            href="/habits"
            className="focus-ring card p-5 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <FlameIcon className="h-6 w-6 text-fox-500" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-bark-800">Habits</h3>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-bark-500">
              Set a daily XP goal and watch your streak survive real life.
            </p>
          </Link>
          <Link
            href="/leagues"
            className="focus-ring card p-5 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <TrophyIcon className="h-6 w-6 text-gold-700" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-bark-800">Leagues</h3>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-bark-500">
              Weekly leagues keep the goal competitive without shaming anyone.
            </p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-bark-800">
              Good to know.
            </h2>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-bark-500">
              The short answers. If something still feels unclear, the course path shows every
              lesson, checkpoint and review before you start.
            </p>
          </div>
          <div className="space-y-2">
            {FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border-2 border-cream-200 bg-white p-4 shadow-card-sm transition hover:border-speeko-200"
              >
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg font-display text-base font-extrabold text-bark-800 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="text-xl font-black leading-none text-speeko-600 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-bark-500">
                  {item.answer}
                </p>
              </details>
            ))}
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
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Footer">
            <Link href="/learn" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Courses
            </Link>
            <Link href="/practice" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Practice
            </Link>
            <Link href="/habits" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Habits
            </Link>
            <Link href="/shop" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Shop
            </Link>
            <Link href="/studio" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Studio
            </Link>
            <Link href="/licenses" className="text-xs font-bold text-bark-400 hover:text-bark-700">
              Licenses
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
