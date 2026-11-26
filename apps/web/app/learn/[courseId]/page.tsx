'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { eligibleExercises, type Course } from '@speeko/core';
import { ProgressBar } from '@/components/ProgressBar';
import { Fox } from '@/components/Fox';
import { StatPill } from '@/components/AppHeader';
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckIcon,
  FlameIcon,
  GiftIcon,
  LockIcon,
  PlayIcon,
  RefreshIcon,
  TrophyIcon,
} from '@/components/icons';
import { LOCALE_META, fetchCourse } from '@/lib/courses';
import { dueReviewCount } from '@/lib/review';
import { courseStats, isLessonCompleted, lessonStatus } from '@/lib/progress';
import { useProgress } from '@/lib/use-progress';
import { CourseSwitcher } from '@/components/CourseSwitcher';

const WAVE_OFFSETS = [0, 56, 0, -56] as const;

const UNIT_BANNERS = [
  'from-speeko-600 to-speeko-700',
  'from-[#b54708] to-[#93370d]',
  'from-[#1f5f8b] to-[#16466b]',
  'from-[#6d327c] to-[#4e2159]',
] as const;

function waveX(step: number): number {
  return WAVE_OFFSETS[((step % WAVE_OFFSETS.length) + WAVE_OFFSETS.length) % WAVE_OFFSETS.length] ?? 0;
}

type TrailState = 'completed' | 'active' | 'upcoming';

function TrailConnector({
  fromX,
  toX,
  state,
  height = 44,
}: {
  fromX: number;
  toX: number;
  state: TrailState;
  height?: number;
}) {
  const midY = height / 2;
  const d = `M ${fromX} 0 C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${height}`;
  const stroke =
    state === 'completed'
      ? '#37b02c'
      : state === 'active'
        ? '#ef6a1c'
        : '#d5c7b2';

  return (
    <svg
      aria-hidden="true"
      width={320}
      height={height}
      viewBox={`-160 0 320 ${height}`}
      className="pointer-events-none mx-auto block h-auto w-[320px] select-none overflow-visible"
    >
      <path
        d={d}
        fill="none"
        stroke="#efe4d2"
        strokeWidth={state === 'upcoming' ? 10 : 12}
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={state === 'upcoming' ? '7 9' : state === 'active' ? '10 6' : undefined}
      />
      {state === 'completed' ? (
        <path
          d={d}
          fill="none"
          stroke="#8add7f"
          strokeWidth={2}
          strokeLinecap="round"
          strokeOpacity={0.75}
        />
      ) : null}
    </svg>
  );
}

function PathNode({
  href,
  icon,
  label,
  sub,
  tone,
  locked = false,
  lockedReason,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  tone: 'chest' | 'review' | 'checkpoint' | 'milestone';
  locked?: boolean;
  lockedReason?: string;
}) {
  const tones = {
    chest: 'bg-fox-100 text-fox-700 border-fox-300 border-b-fox-400',
    review: 'bg-speeko-50 text-speeko-700 border-speeko-300 border-b-speeko-500',
    checkpoint: 'bg-gold-100 text-gold-700 border-gold-200 border-b-fox-400',
    milestone: 'bg-speeko-500 text-white border-speeko-600 border-b-speeko-700',
  } as const;
  const circle = (
    <span
      className={`flex h-[60px] w-[60px] items-center justify-center rounded-2xl border-2 border-b-4 shadow-card-sm transition duration-200 ${
        locked ? 'border-cream-200 border-b-cream-300 bg-cream-100 text-bark-500' : `${tones[tone]} group-hover:-translate-y-0.5`
      }`}
    >
      {locked ? <LockIcon className="h-6 w-6" /> : icon}
    </span>
  );
  const copy = (
    <span className="text-center">
      <span
        className={`block font-display text-xs font-extrabold leading-tight ${
          locked ? 'text-bark-500' : 'text-bark-800'
        }`}
      >
        {label}
      </span>
      <span className="mt-0.5 block text-[11px] font-bold tracking-[0.04em] text-bark-500">
        {sub}
      </span>
    </span>
  );

  if (locked) {
    return (
      <span
        aria-disabled="true"
        title={lockedReason ?? 'Locked'}
        className="flex w-28 flex-col items-center gap-1.5 opacity-85"
      >
        {circle}
        {copy}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="focus-ring group flex w-28 flex-col items-center gap-1.5 rounded-2xl"
    >
      {circle}
      {copy}
    </Link>
  );
}

export default function CoursePathPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const progress = useProgress();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrolledToCurrent = useRef(false);

  useEffect(() => {
    let active = true;
    setCourse(null);
    setError(null);
    scrolledToCurrent.current = false;
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

  // Follow natural top-down Duolingo reading flow (Unit 1 at top -> Unit N below).
  // Once the learner has finished at least one lesson, gently center their active
  // lesson in view without jumping away from Unit 1 on a brand-new path.
  useEffect(() => {
    if (!course || !progress || scrolledToCurrent.current) return;
    const currentStats = courseStats(course, progress);
    if (currentStats.completed === 0 || currentStats.allComplete) {
      scrolledToCurrent.current = true;
      return;
    }
    const nextLessonId = currentStats.nextLessonId;
    if (!nextLessonId) return;
    const frame = requestAnimationFrame(() => {
      const node = document.querySelector<HTMLElement>(
        `[data-path-lesson="${nextLessonId}"]`,
      );
      if (!node) return;
      node.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
      scrolledToCurrent.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [course, progress]);

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
        <p className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-bark-500">
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
            <CourseSwitcher courseId={course.id} />
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

        <div className="mt-10 flex flex-col items-center">
          {course.units.map((unit, unitIndex) => {
            const unitDone = unit.lessons.filter((lesson) =>
              isLessonCompleted(progress, course.id, lesson.id),
            ).length;
            const unitAllDone = unit.lessons.length > 0 && unitDone === unit.lessons.length;
            const unitNumber = unitIndex + 1;
            const isCheckpointUnit = unitNumber % 2 === 0;
            const checkpointUpTo = unitNumber;
            const priorLessons = course.units
              .slice(0, checkpointUpTo)
              .flatMap((entry) => entry.lessons);
            const checkpointUnlocked =
              priorLessons.length > 0 &&
              priorLessons.every((lesson) =>
                isLessonCompleted(progress, course.id, lesson.id),
              );
            const checkpointId = `checkpoint-unit-${checkpointUpTo}`;
            const bannerGradient = UNIT_BANNERS[unitIndex % UNIT_BANNERS.length] ?? meta.gradient;
            const hasNextUnit = unitIndex < course.units.length - 1;
            const nextUnit = hasNextUnit ? course.units[unitIndex + 1]! : null;
            const lessonOffsets = unit.lessons.map((_, lessonIndex) =>
              waveX(unitIndex * 2 + lessonIndex),
            );
            const firstOffsetX = lessonOffsets[0] ?? 0;
            const lastOffsetX = lessonOffsets[lessonOffsets.length - 1] ?? 0;
            const firstTrailState: TrailState =
              unit.lessons[0] && isLessonCompleted(progress, course.id, unit.lessons[0].id)
                ? 'completed'
                : unit.lessons[0]?.id === nextLessonId
                  ? 'active'
                  : 'upcoming';

            return (
              <section key={unit.id} className="relative flex w-full max-w-xl flex-col items-center">
                <div
                  className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-r px-5 py-4 text-white shadow-card-sm ${bannerGradient}`}
                >
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/85">
                        Module {unitNumber} · Unit {unitNumber}
                      </p>
                      <h2 className="font-display text-2xl font-extrabold leading-tight">
                        {unit.title}
                      </h2>
                      {unit.description ? (
                        <p className="mt-0.5 text-sm font-semibold text-white/90">
                          {unit.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="rounded-full bg-white/20 px-3 py-1 font-display text-xs font-extrabold">
                        {unitDone}/{unit.lessons.length}
                      </span>
                      {unitAllDone ? (
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-[0.12em] text-speeko-700">
                          Complete
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {unit.lessons.length > 0 ? (
                  <TrailConnector
                    fromX={0}
                    toX={firstOffsetX}
                    state={firstTrailState}
                    height={32}
                  />
                ) : null}

                <ol className="flex w-full flex-col items-center">
                  {unit.lessons.map((lesson, lessonIndex) => {
                    const status = lessonStatus(course, lesson.id, progress, stats);
                    const x = lessonOffsets[lessonIndex] ?? 0;
                    const nextLessonInUnit = unit.lessons[lessonIndex + 1];
                    const nextX = lessonOffsets[lessonIndex + 1] ?? 0;
                    const connectorState: TrailState =
                      status === 'completed' && nextLessonInUnit?.id === nextLessonId
                        ? 'active'
                        : status === 'completed'
                          ? 'completed'
                          : 'upcoming';

                    const node = (
                      <span
                        className={`flex h-[78px] w-[78px] items-center justify-center rounded-full border-2 border-b-[6px] shadow-card transition duration-200 group-active:translate-y-1 group-active:border-b-2 ${
                          status === 'completed'
                            ? 'border-speeko-600 border-b-speeko-800 bg-speeko-500 text-white group-hover:-translate-y-0.5'
                            : status === 'current'
                              ? 'border-fox-600 border-b-fox-700 bg-fox-500 text-white group-hover:-translate-y-0.5'
                              : 'border-cream-300 border-b-bark-300/60 bg-cream-200 text-bark-500'
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
                      <li
                        key={lesson.id}
                        data-path-lesson={lesson.id}
                        style={{ animationDelay: `${Math.min(unitIndex * 2 + lessonIndex, 8) * 55}ms` }}
                        className="relative flex w-full scroll-mt-24 flex-col items-center animate-rise"
                      >
                        <div
                          className="relative z-10 flex flex-col items-center"
                          style={{ transform: `translateX(${x}px)` }}
                        >
                          {status === 'current' ? (
                            <span className="mb-1.5 inline-block animate-bob rounded-xl border-2 border-fox-600 bg-white px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-fox-700 shadow-card-sm">
                              Start now
                            </span>
                          ) : null}

                          <div className="relative flex items-center justify-center">
                            {status === 'current' ? (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0 animate-pulse-ring rounded-full border-4 border-fox-300"
                                />
                                <div
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
                                    x > 0 ? 'right-full mr-3' : 'left-full ml-3'
                                  }`}
                                >
                                  <Fox
                                    mood="happy"
                                    patrol
                                    accessory={progress?.equippedCosmetic ?? null}
                                    lookAt={{ x: x > 0 ? 0.65 : -0.65, y: 0.15 }}
                                    className="h-20 w-20 drop-shadow-sm sm:h-24 sm:w-24"
                                  />
                                </div>
                              </>
                            ) : null}

                            {status === 'locked' ? (
                              <span
                                role="img"
                                aria-label={`Locked lesson ${lesson.title}. Finish the previous lesson first.`}
                                title="Finish the previous lesson first"
                              >
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

                          <div className="mt-2 max-w-[11.5rem] rounded-xl bg-cream-50/90 px-2.5 py-0.5 text-center">
                            <p
                              className={`font-display text-sm font-extrabold leading-tight ${
                                status === 'locked' ? 'text-bark-500' : 'text-bark-800'
                              }`}
                            >
                              {lesson.title}
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-bark-500">
                              {status === 'completed'
                                ? 'Completed'
                                : `${eligibleExercises(lesson.exercises).length} exercises`}
                            </p>
                          </div>
                        </div>

                        {nextLessonInUnit ? (
                          <div className="relative z-0 -my-1">
                            <TrailConnector
                              fromX={x}
                              toX={nextX}
                              state={connectorState}
                              height={42}
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>

                {unit.lessons.length > 0 ? (
                  <div className="relative z-0 -my-1">
                    <TrailConnector
                      fromX={lastOffsetX}
                      toX={0}
                      state={unitAllDone ? 'completed' : 'upcoming'}
                      height={34}
                    />
                  </div>
                ) : null}

                <div
                  className={`relative w-full max-w-md rounded-3xl border-2 px-4 py-4 shadow-card-sm ${
                    unitAllDone
                      ? 'border-speeko-200 bg-speeko-50/70'
                      : 'border-cream-200 bg-white/95'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-bark-500">
                    <span>
                      {isCheckpointUnit ? `Checkpoint ${unitNumber} gate` : `Module ${unitNumber} rewards`}
                    </span>
                    <span className={unitAllDone ? 'text-speeko-700' : 'text-bark-500'}>
                      {hasNextUnit && nextUnit ? `Leads to ${nextUnit.title}` : 'Final milestone'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5">
                    <PathNode
                      href={`/learn/${course.id}/guidebook/${unitNumber}`}
                      icon={<GiftIcon className="h-7 w-7" />}
                      label="Unit chest"
                      sub="Words & guidebook"
                      tone="chest"
                    />
                    <PathNode
                      href={`/lesson/${course.id}/review`}
                      icon={<RefreshIcon className="h-7 w-7" />}
                      label="Review"
                      sub={dueCount > 0 ? `${dueCount} due` : 'Nothing due'}
                      tone="review"
                      locked={dueCount === 0}
                      lockedReason="Complete a lesson first or wait until a card is due for review"
                    />
                    {isCheckpointUnit ? (
                      <PathNode
                        href={`/lesson/${course.id}/${checkpointId}`}
                        icon={<TrophyIcon className="h-7 w-7" />}
                        label="Checkpoint"
                        sub={
                          checkpointUnlocked
                            ? `Units 1–${checkpointUpTo}`
                            : `Finish units 1–${checkpointUpTo} first`
                        }
                        tone="checkpoint"
                        locked={!checkpointUnlocked}
                        lockedReason={`Finish units 1–${checkpointUpTo} first`}
                      />
                    ) : null}
                  </div>
                </div>

                {hasNextUnit ? (
                  <div className="flex flex-col items-center">
                    <TrailConnector
                      fromX={0}
                      toX={0}
                      state={unitAllDone ? 'completed' : 'upcoming'}
                      height={36}
                    />
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <section className="card mt-12 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <Fox
            mood={stats.allComplete ? 'celebrate' : 'idle'}
            accessory={progress?.equippedCosmetic ?? null}
            patrol
            className="h-20 w-20 shrink-0"
          />
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
