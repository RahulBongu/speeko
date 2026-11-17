'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  type Course,
  eligibleExercises,
  guidebookItems,
} from '@speeko/core';
import { ArrowLeftIcon, BookOpenIcon, CheckIcon } from '@/components/icons';
import { Fox } from '@/components/Fox';
import { LOCALE_META, fetchCourse } from '@/lib/courses';

export default function UnitGuidebookPage({
  params,
}: {
  params: Promise<{ courseId: string; unitIndex: string }>;
}) {
  const { courseId, unitIndex } = use(params);
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

  const unitPosition = Number(unitIndex);
  const unit = Number.isInteger(unitPosition)
    ? course?.units[unitPosition - 1] ?? null
    : null;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Fox mood="sad" className="h-32 w-32" />
        <h1 className="font-display text-3xl font-extrabold text-bark-800">
          We couldn&apos;t open this guidebook
        </h1>
        <p className="max-w-md text-sm font-semibold text-bark-500">{error}</p>
        <Link href={`/learn/${courseId}`} className="btn-primary">
          Back to the path
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <Fox className="h-28 w-28 animate-bob" />
        <p className="sr-only">Loading guidebook</p>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Fox mood="sad" className="h-32 w-32" />
        <h1 className="font-display text-3xl font-extrabold text-bark-800">
          That unit does not exist
        </h1>
        <p className="max-w-md text-sm font-semibold text-bark-500">
          Pick a unit from the course path and try again.
        </p>
        <Link href={`/learn/${courseId}`} className="btn-primary">
          Back to the path
        </Link>
      </div>
    );
  }

  const meta = LOCALE_META[course.locale];
  const extracted = guidebookItems(unit.lessons.flatMap((lesson) => lesson.exercises));
  const targetItems = new Map<string, { prompt: string; kind: string }>(
    extracted.map((item) => [item.target, { prompt: item.prompt, kind: item.kind }]),
  );

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-cream-200/80 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={`/learn/${courseId}`}
            aria-label="Back to the course path"
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-bark-400 transition hover:bg-cream-100 hover:text-bark-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="eyebrow">
              Unit {unitPosition} guidebook
            </p>
            <p className="truncate font-display text-sm font-extrabold text-bark-800">
              {unit.title}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-6">
        <section
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-card sm:p-8 ${meta.gradient}`}
        >
          <span
            aria-hidden="true"
            className="script-text pointer-events-none absolute -right-3 -top-10 text-[9rem] font-extrabold leading-none opacity-20"
          >
            {meta.glyph}
          </span>
          <div className="relative">
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/80">
              <BookOpenIcon className="h-4 w-4" />
              {meta.native} guidebook
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              {unit.title}
            </h1>
            {unit.description ? (
              <p className="mt-2 max-w-lg text-sm font-semibold text-white/85">
                {unit.description}
              </p>
            ) : null}
          </div>
        </section>

        <section className="card mt-6 p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-bark-800">
            Words and phrases in this unit
          </h2>
          <p className="mt-1 text-sm font-semibold text-bark-500">
            These come straight from the exercises ahead — review them, then test yourself on the path.
          </p>
          {targetItems.size > 0 ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {[...targetItems.entries()].map(([target, info]) => (
                <li
                  key={target}
                  className="flex items-start gap-3 rounded-2xl border-2 border-cream-200 bg-white px-4 py-3"
                >
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-speeko-600" />
                  <span>
                    <span className="script-text block font-display text-lg font-extrabold text-bark-800">
                      {target}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-bark-400">
                      {info.prompt}
                    </span>
                    <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-bark-500">
                      {info.kind}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm font-semibold text-bark-400">
              No practice items are published for this unit yet.
            </p>
          )}
        </section>

        <section className="card mt-4 p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-bark-800">Lesson plan</h2>
          <ol className="mt-3 divide-y divide-cream-200">
            {unit.lessons.map((lesson, index) => (
              <li key={lesson.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-display font-extrabold text-bark-700">
                    {index + 1}. {lesson.title}
                  </span>
                  <span className="block text-xs font-semibold text-bark-400">
                    {eligibleExercises(lesson.exercises).length} exercises · {lesson.xpReward} XP
                  </span>
                </span>
                <span className="rounded-full bg-speeko-50 px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-speeko-700">
                  Lesson
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
