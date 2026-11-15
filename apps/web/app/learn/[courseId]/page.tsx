'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Course } from '@speeko/core';
import { ProgressBar } from '@/components/ProgressBar';
import { Fox } from '@/components/Fox';
import { StatPill } from '@/components/AppHeader';
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckIcon,
  FlameIcon,
  LockIcon,
  PlayIcon,
  RefreshIcon,
  TrophyIcon,
} from '@/components/icons';
import { LOCALE_META, fetchCourse } from '@/lib/courses';
import { dueReviewCount } from '@/lib/review';
import { courseStats, isLessonCompleted, lessonStatus } from '@/lib/progress';
import { useProgress } from '@/lib/use-progress';

const OFFSETS = ['sm:ml-0', 'sm:ml-16', 'sm:ml-32', 'sm:ml-16'] as const;

export default function CoursePathPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const progress = useProgress();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Fox mood="sad" className="h-32 w-32" />
        <h1 className="font-display text-3xl font-extrabold text-bark-800">
          We couldn&apos;t open this course
        </h1>
        <p className="max-w-md text-sm font-semibold text-bark-500">{error}</p>
        <Link href="/learn" className="btn-primary">
          Back to all languages
        </Link>
      </div>
    );
  }

  if (!course || !progress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Fox className="h-28 w-28 animate-bob" />
        <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-400">
          Loading the path…
        </p>
      </div>
    );
  }

  const meta = LOCALE_META[course.locale];
  const stats = courseStats(course, progress);
  const nextLessonId = stats.nextLessonId;
  const dueCount = dueReviewCount(course, progress);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-cream-200/80 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/learn"
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-bark-400 transition hover:bg-cream-100 hover:text-bark-700"
            aria-label="All languages"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-extrabold text-white ${meta.gradient}`}
            >
              <span className="script-text">{meta.glyph}</span>
            </span>
            <span className="truncate font-display text-sm font-extrabold text-bark-700">
              {meta.english}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <StatPill
              icon={<FlameIcon className="h-4 w-4" />}
              value={progress.streak}
              label="Day streak"
              tone="streak"
            />
            <StatPill
              icon={<BoltIcon className="h-4 w-4" />}
              value={`${progress.xp}`}
              label="Total XP"
              tone="xp"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <section
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-card sm:p-8 ${meta.gradient}`}
        >
          <span
            aria-hidden="true"
            className="script-text pointer-events-none absolute -right-4 -top-12 text-[11rem] font-extrabold leading-none opacity-15"
          >
            {meta.glyph}
          </span>
          <div className="relative">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/80">
              {meta.native} · {course.difficulty}
            </p>
            <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              {course.title}
            </h1>
            {course.description ? (
              <p className="mt-2 max-w-xl text-sm font-semibold text-white/85">
                {course.description}
              </p>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              <ProgressBar
                value={stats.total === 0 ? 0 : stats.completed / stats.total}
                className="h-3.5 flex-1"
                trackClassName="bg-white/25"
                barClassName="bg-white"
                label="Course progress"
              />
              <p className="shrink-0 font-display text-sm font-extrabold">
                {stats.completed}/{stats.total} lessons
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                <TrophyIcon className="h-4 w-4" />
                {stats.allComplete
                  ? 'Every lesson complete. Your fox is very proud.'
                  : `${stats.total - stats.completed} lessons left on this path`}
              </p>
              {dueCount > 0 ? (
                <Link
                  href={`/lesson/${course.id}/review`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 font-display text-xs font-extrabold text-white transition hover:bg-white/30"
                >
                  <RefreshIcon className="h-4 w-4" />
                  Review {dueCount} due
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-10 space-y-12">
          {course.units.map((unit, unitIndex) => {
            const unitDone = unit.lessons.filter((lesson) =>
              isLessonCompleted(progress, course.id, lesson.id),
            ).length;
            return (
              <section key={unit.id}>
                <div
                  className={`relative overflow-hidden rounded-3xl bg-gradient-to-r px-5 py-4 text-white shadow-card-sm ${meta.gradient}`}
                >
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/75">
                        Unit {unitIndex + 1}
                      </p>
                      <h2 className="font-display text-2xl font-extrabold leading-tight">
                        {unit.title}
                      </h2>
                      {unit.description ? (
                        <p className="mt-0.5 text-sm font-semibold text-white/85">
                          {unit.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 font-display text-xs font-extrabold">
                      {unitDone}/{unit.lessons.length}
                    </span>
                  </div>
                </div>

                <ol className="mt-7 space-y-5">
                  {unit.lessons.map((lesson, lessonIndex) => {
                    const status = lessonStatus(course, lesson.id, progress, stats);
                    const offset = OFFSETS[(unitIndex * 2 + lessonIndex) % OFFSETS.length] ?? '';
                    const node = (
                      <span
                        className={`flex h-[74px] w-[74px] items-center justify-center rounded-full border-4 border-white shadow-card transition duration-200 ${
                          status === 'completed'
                            ? 'bg-speeko-500 text-white group-hover:-translate-y-1'
                            : status === 'current'
                              ? 'bg-fox-500 text-white group-hover:-translate-y-1'
                              : 'bg-cream-200 text-bark-300'
                        }`}
                      >
                        {status === 'completed' ? (
                          <CheckIcon className="h-8 w-8" />
                        ) : status === 'current' ? (
                          <PlayIcon className="h-7 w-7" />
                        ) : (
                          <LockIcon className="h-7 w-7" />
                        )}
                      </span>
                    );

                    return (
                      <li key={lesson.id} className={`flex scroll-mt-24 ${offset}`}>
                        <div className="relative flex flex-col items-center">
                          <div className="relative">
                            {status === 'current' ? (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 animate-pulse-ring rounded-full border-4 border-fox-300"
                              />
                            ) : null}
                            {status === 'locked' ? (
                              <span aria-disabled="true" title="Finish the previous lesson first">
                                {node}
                              </span>
                            ) : (
                              <Link
                                href={`/lesson/${course.id}/${lesson.id}`}
                                className="focus-ring group block rounded-full"
                                aria-label={`${status === 'completed' ? 'Review' : 'Start'} lesson ${lesson.title}`}
                              >
                                {node}
                              </Link>
                            )}
                          </div>
                          <div className="mt-2.5 max-w-[12rem] text-center">
                            <p
                              className={`font-display text-sm font-extrabold leading-tight ${
                                status === 'locked' ? 'text-bark-300' : 'text-bark-700'
                              }`}
                            >
                              {lesson.title}
                            </p>
                            {status === 'current' ? (
                              <span className="mt-1 inline-block rounded-md bg-fox-100 px-2 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-[0.14em] text-fox-700">
                                Start now
                              </span>
                            ) : (
                              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-bark-300">
                                {status === 'completed'
                                  ? 'Completed'
                                  : `${lesson.exercises.length} exercises`}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <section className="card mt-12 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <Fox mood={stats.allComplete ? 'celebrate' : 'idle'} className="h-20 w-20 shrink-0" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-extrabold text-bark-800">
              {stats.allComplete ? 'Course complete!' : 'Small steps, every day'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-bark-500">
              {stats.allComplete
                ? 'Replay any lesson to keep it fresh, or start another language.'
                : 'Finish the glowing lesson to unlock the next one.'}
            </p>
          </div>
          {stats.allComplete ? (
            <Link href="/learn" className="btn-primary shrink-0">
              Another language
            </Link>
          ) : nextLessonId ? (
            <Link
              href={`/lesson/${course.id}/${nextLessonId}`}
              className="btn-primary shrink-0"
            >
              Continue
            </Link>
          ) : null}
        </section>
      </main>
    </div>
  );
}
