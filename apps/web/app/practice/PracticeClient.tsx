'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LEITNER_BOX_DAYS,
  practiceOverview,
  type Course,
} from '@speeko/core';
import { SiteHeader } from '@/components/AppHeader';
import { CourseSwitcher } from '@/components/CourseSwitcher';
import { Fox } from '@/components/Fox';
import {
  ArrowRightIcon,
  CheckIcon,
  FlameIcon,
  LockIcon,
  RefreshIcon,
  StarIcon,
} from '@/components/icons';
import {
  fetchCourse,
  fetchManifest,
  LOCALE_META,
  type CourseManifestEntry,
} from '@/lib/courses';
import { useProgress } from '@/lib/use-progress';

function relativeDue(at: number, now = Date.now()): string {
  const diff = Math.max(0, at - now);
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hr${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

function PracticeStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'due' | 'trouble' | 'long-term';
}) {
  const tones = {
    due: 'bg-speeko-50 text-speeko-700 border-speeko-200',
    trouble: 'bg-fox-100 text-fox-700 border-fox-200',
    'long-term': 'bg-gold-100 text-gold-700 border-gold-200',
  } as const;
  return (
    <div className={`rounded-2xl border-2 px-3 py-3 text-center ${tones[tone]}`}>
      <span className="mx-auto flex h-6 w-6 items-center justify-center">{icon}</span>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em]">
        {label}
      </p>
    </div>
  );
}

export default function PracticeClient() {
  const progress = useProgress();
  const [manifest, setManifest] = useState<CourseManifestEntry[] | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchManifest()
      .then((entries) => {
        if (active) setManifest(entries);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Could not load your courses.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const courseId =
    progress?.lastCourseId && manifest?.some((entry) => entry.id === progress.lastCourseId)
      ? progress.lastCourseId
      : (manifest?.[0]?.id ?? null);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    setCourse(null);
    setError(null);
    fetchCourse(courseId)
      .then((loaded) => {
        if (active) setCourse(loaded);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load the course.');
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  const header = <SiteHeader active="practice" />;

  if (error) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox mood="sad" className="h-32 w-32" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-bark-800">
            Practice needs a course
          </h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">{error}</p>
          <Link href="/learn" className="btn-primary mt-6">
            Browse courses
          </Link>
        </main>
      </div>
    );
  }

  if (!progress || !manifest || !course) {
    return (
      <div className="min-h-screen">
        {header}
        <main className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
          <Fox className="h-28 w-28 animate-bob" />
          <p className="mt-3 font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
            Building your practice queue…
          </p>
        </main>
      </div>
    );
  }

  const overview = practiceOverview(course, progress);
  const meta = LOCALE_META[course.locale];
  const startedUnits = overview.units.filter((unit) => unit.started);
  const firstStarted = startedUnits[0] ?? null;
  const nextPracticeHref = firstStarted
    ? `/lesson/${course.id}/practice-unit-${firstStarted.index}`
    : `/learn/${course.id}`;

  return (
    <div className="min-h-screen">
      {header}
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">
              Practice
            </p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-bark-800 sm:text-5xl">
              Make it stick.
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold text-bark-500">
              Short sessions from the words you have already answered. No new lessons and no XP —
              just the items that need another pass.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border-2 border-cream-200 bg-white p-3 shadow-card-sm sm:w-auto">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${meta.gradient}`}
            >
              <span className="script-text text-xl font-extrabold">{meta.glyph}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
                Practicing
              </p>
              <CourseSwitcher courseId={course.id} destination="practice" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid max-w-lg grid-cols-3 gap-2.5">
          <PracticeStat
            label="Due now"
            value={overview.dueCount}
            icon={<RefreshIcon className="h-5 w-5" />}
            tone="due"
          />
          <PracticeStat
            label="Trouble words"
            value={overview.troubleCount}
            icon={<FlameIcon className="h-5 w-5" />}
            tone="trouble"
          />
          <PracticeStat
            label="Long-term"
            value={overview.masteredCount}
            icon={<StarIcon className="h-5 w-5" />}
            tone="long-term"
          />
        </div>

        {overview.dueCount > 0 ? (
          <section className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-speeko-500 to-speeko-700 p-6 text-white shadow-card sm:p-8">
            <div aria-hidden="true" className="hero-dots absolute inset-0 opacity-10" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/75">
                  Review queue
                </p>
                <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                  {overview.dueCount} word{overview.dueCount === 1 ? '' : 's'} ready
                </h2>
                <p className="mt-2 max-w-xl text-sm font-semibold text-white/85">
                  A correct answer moves a word one box forward. A miss brings it back tomorrow.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {LEITNER_BOX_DAYS.map((days) => (
                    <span
                      key={days}
                      className="rounded-full bg-white/15 px-2.5 py-1 font-display text-[11px] font-extrabold text-white/90"
                    >
                      {days}d
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/lesson/${course.id}/review`}
                className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-display text-sm font-extrabold uppercase tracking-wide text-speeko-700 shadow-[0_4px_0_#d6eccb] transition hover:bg-cream-50 active:translate-y-[3px] active:shadow-none"
              >
                Review now
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </section>
        ) : overview.hasPractice ? (
          <section className="card mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <Fox
              mood="happy"
              accessory={progress.equippedCosmetic ?? null}
              patrol
              className="h-24 w-24 shrink-0"
            />
            <div className="flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
                Review queue
              </p>
              <h2 className="mt-0.5 font-display text-2xl font-extrabold text-bark-800">
                All caught up
              </h2>
              <p className="mt-1 text-sm font-semibold text-bark-500">
                {overview.nextDueAt
                  ? `The next review is ${relativeDue(overview.nextDueAt)}.`
                  : 'Nothing is scheduled ahead.'}{' '}
                {overview.troubleCount > 0
                  ? 'Trouble words are always fair game.'
                  : 'Practice a unit to keep your memory warm.'}
              </p>
            </div>
            <Link href={nextPracticeHref} className="btn-primary shrink-0">
              {overview.troubleCount > 0 ? 'Practice trouble words' : 'Practice a unit'}
            </Link>
          </section>
        ) : (
          <section className="card mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <Fox
              mood="sleepy"
              accessory={progress.equippedCosmetic ?? null}
              className="h-24 w-24 shrink-0"
              title="Speeko resting until your first lesson"
            />
            <div className="flex-1">
              <h2 className="font-display text-2xl font-extrabold text-bark-800">
                Nothing to practice yet
              </h2>
              <p className="mt-1 text-sm font-semibold text-bark-500">
                The hub only uses lessons you have actually answered. Finish your first lesson and
                your review queue starts here.
              </p>
            </div>
            <Link href={`/learn/${course.id}`} className="btn-primary shrink-0">
              Go to {course.title}
            </Link>
          </section>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
          <div className="card p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
              Your boxes
            </p>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {LEITNER_BOX_DAYS.map((days, index) => (
                <div
                  key={days}
                  className="rounded-xl border-2 border-cream-200 bg-cream-50 px-1 py-2 text-center"
                >
                  <p className="font-display text-lg font-extrabold leading-none text-bark-700">
                    {overview.boxCounts[index + 1] ?? 0}
                  </p>
                  <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-bark-400">
                    {days} day{days === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-bark-500">
              {overview.learnedCount > 0
                ? `${overview.learnedCount} learned word${overview.learnedCount === 1 ? '' : 's'} in rotation. Correct answers move right; misses go back to day one.`
                : 'Every word you answer enters box one. Correct answers move it right; misses go back to day one.'}
            </p>
          </div>

          <div className="card p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
              Trouble words
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-bark-800">
              {overview.troubleCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-bark-500">
              Words you have missed at least once. They always stay available for another pass.
            </p>
            {overview.troubleCount > 0 ? (
              <Link
                href={`/lesson/${course.id}/practice-trouble`}
                className="btn-secondary mt-4 w-full"
              >
                Practice trouble words
              </Link>
            ) : (
              <p className="mt-4 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-bark-500">
                <CheckIcon className="h-4 w-4" />
                {overview.hasPractice ? 'None right now' : 'Nothing missed yet'}
              </p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">
                By unit
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-bark-800">
                Practice what you have unlocked
              </h2>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-bark-500">
              {startedUnits.length} of {overview.units.length} units started
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {overview.units.map((unit) =>
              unit.started ? (
                <Link
                  key={unit.id}
                  href={`/lesson/${course.id}/practice-unit-${unit.index}`}
                  aria-label={`Practice unit ${unit.index}: ${unit.title}`}
                  className="focus-ring group flex items-center gap-3 rounded-2xl border-2 border-cream-200 bg-white p-4 shadow-card-sm transition duration-200 hover:-translate-y-0.5 hover:border-speeko-300 hover:shadow-card sm:gap-4"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-speeko-50 font-display text-lg font-extrabold text-speeko-700">
                    {unit.index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-extrabold leading-tight text-bark-800">
                      {unit.title}
                    </p>
                    <p className="text-xs font-semibold text-bark-400">
                      {unit.completedLessons}/{unit.lessons} lessons complete ·{' '}
                      {unit.learnedExercises} exercises ready
                    </p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-cream-100 px-3 py-2 font-display text-xs font-extrabold uppercase tracking-wide text-bark-600 transition group-hover:bg-speeko-100 group-hover:text-speeko-700 sm:inline-flex">
                    Practice
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-bark-300 group-hover:text-speeko-600 sm:hidden" />
                </Link>
              ) : (
                <div
                  key={unit.id}
                  aria-disabled="true"
                  className="flex items-center gap-3 rounded-2xl border-2 border-cream-200 bg-cream-50/70 p-4 opacity-75 sm:gap-4"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cream-200 text-bark-300">
                    <LockIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-extrabold leading-tight text-bark-400">
                      {unit.title}
                    </p>
                    <p className="text-xs font-semibold text-bark-400">
                      {unit.lessons} lessons · Finish a lesson to unlock practice
                    </p>
                  </div>
                  <span className="hidden shrink-0 font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500 sm:block">
                    Locked
                  </span>
                </div>
              ),
            )}
          </div>
        </section>

        <div className="mt-8 flex justify-center">
          <Link href={`/learn/${course.id}`} className="btn-secondary">
            Open course path
          </Link>
        </div>
      </main>
    </div>
  );
}
