'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { levelForXp } from '@speeko/core';
import { SiteHeader, StatPill } from '@/components/AppHeader';
import { Fox } from '@/components/Fox';
import { ProgressBar } from '@/components/ProgressBar';
import { BoltIcon, CheckIcon, FlameIcon, PlayIcon, TrophyIcon } from '@/components/icons';
import {
  fetchManifest,
  LOCALE_META,
  type CourseManifestEntry,
} from '@/lib/courses';
import { completedInCourse, DAILY_GOAL } from '@/lib/progress';
import { useProgress } from '@/lib/use-progress';

export default function LearnClient() {
  const progress = useProgress();
  const [manifest, setManifest] = useState<CourseManifestEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    fetchManifest()
      .then((entries) => {
        if (active) setManifest(entries);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load courses.');
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const started = Boolean(progress && progress.xp > 0);
  const lastCourse = progress?.lastCourseId
    ? manifest?.find((entry) => entry.id === progress.lastCourseId)
    : undefined;
  const continueEntry = lastCourse ?? manifest?.[0] ?? null;
  const continueMeta = continueEntry ? LOCALE_META[continueEntry.locale] : null;
  const continueDone = continueEntry && progress
    ? completedInCourse(progress, continueEntry.id)
    : 0;
  const todayXp = progress?.todayXp ?? 0;
  const dailyGoal = progress?.dailyGoal ?? DAILY_GOAL;
  const level = levelForXp(progress?.xp ?? 0);

  return (
    <div className="min-h-screen">
      <SiteHeader active="learn" />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">
              Your learning
            </p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight text-bark-800 sm:text-5xl">
              What do you want to learn?
            </h1>
            <p className="mt-2 max-w-lg text-sm font-semibold text-bark-500">
              Ten Indian languages, one small lesson at a time. Pick up any course — your progress
              stays in this browser.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-80">
            <StatPill
              icon={<FlameIcon className="h-4 w-4" />}
              value={progress?.streak ?? 0}
              label="Day streak"
              tone="streak"
            />
            <StatPill
              icon={<BoltIcon className="h-4 w-4" />}
              value={`${progress?.xp ?? 0} XP`}
              label="Total XP"
              tone="xp"
            />
            <StatPill
              icon={<TrophyIcon className="h-4 w-4" />}
              value={`Lvl ${level}`}
              label="Level"
              tone="default"
            />
            <Link
              href="/habits"
              aria-label="Open habits, daily goal, and streak calendar"
              className="focus-ring rounded-2xl"
            >
              <StatPill
                icon={<BoltIcon className="h-4 w-4" />}
                value={`${Math.min(todayXp, dailyGoal)}/${dailyGoal} XP`}
                label="Daily XP goal"
                tone="goal"
              />
            </Link>
          </div>
        </div>

        {continueEntry && continueMeta ? (
          <section className="mt-8 overflow-hidden rounded-3xl border-2 border-cream-200 bg-white shadow-card">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${continueMeta.gradient}`}
                >
                  <span className="script-text text-3xl font-extrabold">{continueMeta.glyph}</span>
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-bark-500">
                    {started ? 'Pick up where you left off' : 'Start here'}
                  </p>
                  <h2 className="font-display text-2xl font-extrabold leading-tight text-bark-800">
                    {continueMeta.native} · {continueMeta.english}
                  </h2>
                  <p className="text-sm font-semibold text-bark-400">
                    {continueDone} of {continueEntry.lessons} lessons complete
                  </p>
                </div>
              </div>
              <Link
                href={`/learn/${continueEntry.id}`}
                className="btn-primary w-full sm:w-auto"
              >
                <PlayIcon className="h-4 w-4" />
                {started ? 'Continue' : 'Start learning'}
              </Link>
            </div>
            <ProgressBar
              value={continueEntry.lessons === 0 ? 0 : continueDone / continueEntry.lessons}
              className="h-2 rounded-none"
              barClassName="bg-speeko-400"
              label={`${continueMeta.english} course progress`}
            />
          </section>
        ) : null}

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-2xl font-extrabold text-bark-800">All courses</h2>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-bark-500">
              {manifest?.length ?? 10} languages
            </p>
          </div>

          {error ? (
            <div className="card mt-4 p-6 text-center">
              <p className="font-display text-lg font-extrabold text-bark-700">
                Courses couldn&apos;t load
              </p>
              <p className="mt-1 text-sm font-semibold text-bark-500">{error}</p>
              <button type="button" className="btn-primary mt-4" onClick={() => setReloadKey((key) => key + 1)}>
                Try again
              </button>
            </div>
          ) : null}

          {manifest && manifest.length === 0 ? (
            <div className="card mt-4 p-6 text-center">
              <p className="font-display text-lg font-extrabold text-bark-700">
                No courses published yet
              </p>
              <p className="mt-1 text-sm font-semibold text-bark-500">
                Courses appear here once the manifest lists them. Check back soon.
              </p>
            </div>
          ) : null}

          {!manifest && !error ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-[196px] animate-pulse rounded-3xl border-2 border-cream-200 bg-white/70"
                />
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {manifest?.map((entry) => {
              const meta = LOCALE_META[entry.locale];
              const done = progress ? completedInCourse(progress, entry.id) : 0;
              const complete = done >= entry.lessons;
              return (
                <Link
                  key={entry.id}
                  href={`/learn/${entry.id}`}
                  className="focus-ring group overflow-hidden rounded-3xl border-2 border-cream-200 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-[0_7px_0_#f0d7ba]"
                >
                  <div
                    className={`relative h-24 overflow-hidden bg-gradient-to-br ${meta.gradient} p-4 text-white`}
                  >
                    <span
                      aria-hidden="true"
                      className="script-text absolute -right-1 -top-5 text-[6.5rem] font-extrabold leading-none opacity-20"
                    >
                      {meta.glyph}
                    </span>
                    <span className="relative rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]">
                      {entry.difficulty}
                    </span>
                    <span className="script-text relative ml-2 font-display text-sm font-extrabold">
                      {meta.native}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-extrabold leading-tight text-bark-800">
                          {meta.english}
                        </h3>
                        <p className="text-xs font-semibold text-bark-400">
                          {entry.lessons} lessons · {entry.exercises} exercises
                        </p>
                      </div>
                      {complete ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-speeko-100 text-speeko-700">
                          <CheckIcon className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-100 text-bark-400 transition group-hover:bg-speeko-100 group-hover:text-speeko-700">
                          <PlayIcon className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <ProgressBar
                        value={entry.lessons === 0 ? 0 : done / entry.lessons}
                        className="h-2"
                        barClassName={complete ? 'bg-speeko-500' : 'bg-speeko-400'}
                        label={`${meta.english} progress`}
                      />
                      <p className="mt-1.5 text-[11px] font-bold text-bark-400">
                        {complete ? 'Course complete 🎉' : `${done} of ${entry.lessons} lessons`}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10 flex flex-col items-center gap-4 rounded-3xl border-2 border-cream-200 bg-white p-6 text-center shadow-card sm:flex-row sm:text-left">
          <Fox className="h-20 w-20 shrink-0" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-extrabold text-bark-800">
              More lessons are on the way
            </h2>
            <p className="mt-1 text-sm font-semibold text-bark-500">
              Courses are open content — add or translate lessons in Speeko Studio and they appear
              here on the next build.
            </p>
          </div>
          <Link href="/studio" className="btn-secondary shrink-0">
            Open Studio
          </Link>
        </section>
      </main>
    </div>
  );
}
