'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  accuracy as sessionAccuracy,
  createSession,
  currentExercise,
  gradeExercise,
  INITIAL_HEARTS,
  reduceSession,
  type Course,
  type Exercise,
  type GradeResult,
  type SessionState,
} from '@speeko/core';
import { fetchCourse, findLesson, flattenLessons, type FlatLesson } from '@/lib/courses';
import {
  DAILY_GOAL,
  applyReviews,
  loadProgress,
  recordCompletionAndReviews,
  saveProgress,
  type ProgressState,
} from '@/lib/progress';
import { buildReviewPlan, buildReviewsFromAnswers } from '@/lib/review';
import { Confetti } from '@/components/Confetti';
import { Fox } from '@/components/Fox';
import { ProgressBar } from '@/components/ProgressBar';
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckIcon,
  FlameIcon,
  HeartIcon,
  TrophyIcon,
  XIcon,
} from '@/components/icons';
import { canSubmit, initialDraft, toAnswerInput, type DraftAnswer } from './answer';
import { ExerciseBody } from './ExerciseBody';

type Phase = 'loading' | 'error' | 'playing' | 'feedback' | 'summary' | 'hearts';

const TIPS = [
  'Take your time — accuracy beats speed.',
  'Say each answer out loud as you tap it.',
  'Mistakes are data. The fox is not judging.',
  'One lesson a day keeps the streak alive.',
];

export interface LessonPlayerProps {
  courseId: string;
  lessonId: string;
}

export function LessonPlayer({ courseId, lessonId }: LessonPlayerProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [entry, setEntry] = useState<FlatLesson | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [draft, setDraft] = useState<DraftAnswer | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [answeredExercise, setAnsweredExercise] = useState<Exercise | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [showExit, setShowExit] = useState(false);
  const [postProgress, setPostProgress] = useState<ProgressState | null>(null);

  const shownAt = useRef(Date.now());
  const savedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setError(null);
    setCourse(null);
    setEntry(null);
    setSession(null);
    setDraft(null);
    setGrade(null);
    setAnsweredExercise(null);
    setPostProgress(null);
    savedRef.current = false;

    fetchCourse(courseId)
      .then((loaded) => {
        if (cancelled) return;
        const isReview = lessonId === 'review';
        let found: FlatLesson | null = null;
        if (isReview) {
          const progress = loadProgress();
          const plan = buildReviewPlan(loaded, progress, Date.now());
          if (plan.exercises.length === 0) {
            setError('Nothing is due for review yet. Come back after a few lessons.');
            setPhase('error');
            return;
          }
          found = {
            lesson: {
              id: 'review',
              title: 'Review',
              description: 'Re-practice the skills you are about to forget.',
              order: 999,
              difficulty: 'A1',
              xpReward: 0,
              exercises: plan.exercises,
            },
            unit: {
              id: 'review',
              title: 'Daily review',
              description: 'Spaced repetition, straight from your own progress.',
              order: 999,
              crownLevel: 0,
              lessons: [],
            },
            index: 999,
          };
        } else {
          found = findLesson(loaded, lessonId);
        }
        if (!found) {
          setError('That lesson does not exist in this course.');
          setPhase('error');
          return;
        }
        const first = found.lesson.exercises[0];
        if (!first) {
          setError('This lesson has no exercises yet.');
          setPhase('error');
          return;
        }
        setCourse(loaded);
        setEntry(found);
        setSession(createSession(found.lesson.id, found.lesson.exercises, Date.now()));
        setDraft(initialDraft(first));
        shownAt.current = Date.now();
        setPhase('playing');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Could not load that lesson.');
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const exerciseNow = session ? currentExercise(session) : null;
  const displayExercise = phase === 'feedback' ? answeredExercise : exerciseNow;
  const ready =
    phase === 'playing' &&
    draft !== null &&
    exerciseNow !== null &&
    canSubmit(exerciseNow, draft);

  const nextLesson = useMemo(() => {
    if (!course || !entry) return null;
    const flat = flattenLessons(course);
    const index = flat.findIndex((item) => item.lesson.id === entry.lesson.id);
    if (index < 0) return null;
    return flat[index + 1] ?? null;
  }, [course, entry]);

  const handleCheck = useCallback(() => {
    if (!session || !draft || !exerciseNow || phase !== 'playing') return;
    const input = toAnswerInput(exerciseNow, draft);
    if (!input) return;
    const result = gradeExercise(exerciseNow, input);
    const elapsed = Math.max(0, Date.now() - shownAt.current);
    const next = reduceSession(session, {
      type: 'answer',
      exerciseId: exerciseNow.id,
      correct: result.correct,
      ms: elapsed,
    });
    setGrade(result);
    setAnsweredExercise(exerciseNow);
    setXpGained(next.xp - session.xp);
    setSession(next);
    setPhase('feedback');
  }, [session, draft, exerciseNow, phase]);

  const handleContinue = useCallback(() => {
    if (!session || !entry) return;
    if (session.finished) {
      setPhase(session.hearts <= 0 ? 'hearts' : 'summary');
      return;
    }
    const nextExercise = currentExercise(session);
    if (!nextExercise) {
      setPhase('summary');
      return;
    }
    setDraft(initialDraft(nextExercise));
    setGrade(null);
    setAnsweredExercise(null);
    setXpGained(0);
    shownAt.current = Date.now();
    setPhase('playing');
  }, [session, entry]);

  const restart = useCallback(() => {
    if (!entry) return;
    const first = entry.lesson.exercises[0];
    if (!first) return;
    setSession(createSession(entry.lesson.id, entry.lesson.exercises, Date.now()));
    setDraft(initialDraft(first));
    setGrade(null);
    setAnsweredExercise(null);
    setXpGained(0);
    setPostProgress(null);
    savedRef.current = false;
    shownAt.current = Date.now();
    setPhase('playing');
  }, [entry]);

  useEffect(() => {
    if (phase !== 'summary' || savedRef.current || !session || !course || !entry) return;
    savedRef.current = true;
    const reviews = buildReviewsFromAnswers(session, course.locale);
    const isReview = entry.lesson.id === 'review';
    const updated = isReview
      ? applyReviews(loadProgress(), reviews, Date.now())
      : recordCompletionAndReviews(
          loadProgress(),
          {
            courseId: course.id,
            lessonId: entry.lesson.id,
            xp: session.xp + entry.lesson.xpReward,
            accuracy: sessionAccuracy(session),
          },
          reviews,
        );
    saveProgress(updated);
    setPostProgress(updated);
  }, [phase, session, course, entry]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showExit) setShowExit(false);
        return;
      }
      if (event.key !== 'Enter' || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (phase === 'playing' && ready) {
        event.preventDefault();
        handleCheck();
      } else if (phase === 'feedback') {
        event.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, ready, showExit, handleCheck, handleContinue]);

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Fox className="h-32 w-32 animate-bob" />
        <p className="font-display text-xl font-extrabold text-bark-600">Warming up your lesson…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Fox mood="sad" className="h-32 w-32" />
        <h1 className="font-display text-3xl font-extrabold text-bark-800">
          We couldn&apos;t open that lesson
        </h1>
        <p className="max-w-md text-sm font-semibold text-bark-500">{error}</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Link href={`/learn/${courseId}`} className="btn-primary">
            Back to the course
          </Link>
          <Link href="/learn" className="btn-secondary">
            All languages
          </Link>
        </div>
      </div>
    );
  }

  if (!course || !entry || !session || !draft) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Fox className="h-24 w-24 animate-bob" />
      </div>
    );
  }

  const total = session.exercises.length;
  const progressValue = total === 0 ? 0 : session.answers.length / total;
  const displayNumber = Math.min(
    session.answers.length + (phase === 'playing' ? 1 : 0),
    total,
  );
  const mood =
    phase === 'feedback' ? (grade?.correct ? 'happy' : 'sad') : 'idle';
  const tip = TIPS[session.index % TIPS.length] ?? TIPS[0];

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      {phase === 'summary' ? <Confetti /> : null}

      {phase === 'playing' || phase === 'feedback' ? (
        <header className="sticky top-0 z-20 border-b border-cream-200/80 bg-cream-50/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setShowExit(true)}
              className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-bark-400 transition hover:bg-cream-100 hover:text-bark-700"
              aria-label="Quit lesson"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <ProgressBar
              value={progressValue}
              className="h-4 flex-1"
              barClassName="bg-speeko-400"
              label="Lesson progress"
            />
            <div
              className="flex shrink-0 items-center gap-0.5"
              aria-label={`${session.hearts} of ${INITIAL_HEARTS} hearts left`}
            >
              {Array.from({ length: INITIAL_HEARTS }, (_, index) => (
                <HeartIcon
                  key={index}
                  filled={index < session.hearts}
                  className={`h-5 w-5 ${
                    index < session.hearts ? 'text-red-500' : 'text-cream-300'
                  }`}
                />
              ))}
            </div>
            {session.combo >= 2 ? (
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#fff4d6] px-2 py-1 font-display text-xs font-extrabold text-[#a06b00]">
                <BoltIcon className="h-3.5 w-3.5" />×{session.combo}
              </span>
            ) : null}
          </div>
        </header>
      ) : null}

      {phase === 'summary' ? (
        <SummaryScreen
          course={course}
          entry={entry}
          session={session}
          postProgress={postProgress}
          nextLesson={nextLesson}
        />
      ) : phase === 'hearts' ? (
        <OutOfHeartsScreen
          course={course}
          entry={entry}
          session={session}
          onRestart={restart}
        />
      ) : (
        <main
          className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6 sm:px-6 ${
            phase === 'feedback' ? 'pb-44' : 'pb-10'
          }`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-bark-400">
              Exercise {displayNumber} of {total}
            </p>
            <p className="truncate font-display text-xs font-bold text-bark-400">
              {entry.unit.title} · {entry.lesson.title}
            </p>
          </div>

          <div className="card min-h-[380px] p-5 sm:p-8">
            {displayExercise && draft ? (
              <ExerciseBody
                key={displayExercise.id}
                exercise={displayExercise}
                draft={draft}
                onChange={setDraft}
                disabled={phase === 'feedback'}
                reveal={phase === 'feedback' ? grade : null}
                locale={course.locale}
              />
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Fox mood={mood} className="hidden h-16 w-16 shrink-0 sm:block" />
            <div className="relative hidden flex-1 rounded-2xl border-2 border-cream-200 bg-white px-4 py-3 text-sm font-semibold text-bark-500 shadow-card-sm sm:block">
              <span
                aria-hidden="true"
                className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-cream-200 bg-white"
              />
              {phase === 'feedback'
                ? grade?.correct
                  ? 'That was clean. Keep the streak moving!'
                  : 'All good — the correction is the learning.'
                : tip}
            </div>
          </div>

          {phase === 'playing' ? (
            <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-xs font-semibold text-bark-300 sm:block">
                Press Enter to check
              </p>
              <button
                type="button"
                onClick={handleCheck}
                disabled={!ready}
                className="btn-primary w-full sm:min-w-[180px] sm:w-auto"
              >
                Check
              </button>
            </div>
          ) : null}
        </main>
      )}

      {phase === 'feedback' && grade ? (
        <FeedbackBar
          correct={grade.correct}
          expected={grade.expected}
          xpGained={xpGained}
          combo={session.combo}
          isLast={session.finished}
          onContinue={handleContinue}
        />
      ) : null}

      {showExit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bark-900/40 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setShowExit(false)}
        >
          <div
            className="card w-full max-w-sm animate-pop p-6 text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <Fox className="mx-auto h-24 w-24" />
            <h2 id="exit-title" className="mt-2 font-display text-2xl font-extrabold text-bark-800">
              Leave this lesson?
            </h2>
            <p className="mt-1 text-sm font-semibold text-bark-500">
              Your answers so far won&apos;t be saved. You can restart any time.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="btn-primary" onClick={() => setShowExit(false)}>
                Keep learning
              </button>
              <Link href={`/learn/${course.id}`} className="btn-secondary">
                Leave lesson
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeedbackBar({
  correct,
  expected,
  xpGained,
  combo,
  isLast,
  onContinue,
}: {
  correct: boolean;
  expected: string | null;
  xpGained: number;
  combo: number;
  isLast: boolean;
  onContinue: () => void;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 animate-rise border-t-2 ${
        correct ? 'border-speeko-200 bg-speeko-50' : 'border-red-200 bg-red-50'
      }`}
      role="status"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <Fox mood={correct ? 'happy' : 'sad'} className="hidden h-14 w-14 shrink-0 sm:block" />
          <div>
            <p
              className={`font-display text-xl font-extrabold ${
                correct ? 'text-speeko-800' : 'text-red-800'
              }`}
            >
              {correct ? 'Correct!' : 'Not quite'}
            </p>
            {correct ? (
              <p className="text-sm font-semibold text-speeko-700">
                {xpGained > 0 ? `+${xpGained} XP` : 'Progress saved'}
                {combo >= 2 ? ` · ${combo} in a row` : ''}
              </p>
            ) : expected ? (
              <p className="text-sm font-semibold text-red-700">
                Answer: <span className="script-text font-bold">{expected}</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-red-700">
                Check the highlighted answer and keep going.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className={`${correct ? 'btn-primary' : 'btn-danger'} w-full sm:w-auto sm:min-w-[160px]`}
        >
          {isLast ? 'See results' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function SummaryScreen({
  course,
  entry,
  session,
  postProgress,
  nextLesson,
}: {
  course: Course;
  entry: FlatLesson;
  session: SessionState;
  postProgress: ProgressState | null;
  nextLesson: FlatLesson | null;
}) {
  const accuracy = sessionAccuracy(session);
  const isReview = entry.lesson.id === 'review';
  const awardedXp = session.xp + (isReview ? 0 : entry.lesson.xpReward);
  const todayXp = postProgress?.todayXp ?? 0;
  const streak = postProgress?.streak ?? 0;
  const goalValue = Math.min(1, todayXp / DAILY_GOAL);
  const goalDone = todayXp >= DAILY_GOAL;

  return (
    <main className="relative mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="text-center">
        <div className="relative mx-auto h-44 w-44">
          <div className="absolute inset-0 animate-pop rounded-full bg-gradient-to-br from-fox-300/70 to-speeko-200/70 blur-xl" />
          <Fox mood="celebrate" className="relative h-44 w-44 animate-pop" />
        </div>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-bark-800">
          {isReview ? 'Review complete!' : 'Lesson complete!'}
        </h1>
        <p className="mt-1 font-semibold text-bark-500">
          {isReview ? 'Spaced repetition' : entry.lesson.title} · {course.title}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-3">
        <StatCard
          label={isReview ? 'Skills updated' : 'XP earned'}
          value={isReview ? `${session.answers.length}` : `+${awardedXp}`}
          icon={<TrophyIcon className="h-5 w-5" />}
          tone="xp"
        />
        <StatCard label="Accuracy" value={`${Math.round(accuracy * 100)}%`} icon={<CheckIcon className="h-5 w-5" />} tone="green" />
        <StatCard label="Best combo" value={`×${session.maxCombo}`} icon={<BoltIcon className="h-5 w-5" />} tone="streak" />
      </div>

      {isReview ? (
        <div className="card mt-4 p-5 text-center">
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-bark-400">
            Spaced repetition
          </p>
          <p className="mt-2 text-sm font-semibold text-bark-500">
            Cards you practiced are now scheduled for their next review — sooner for the ones you
            missed, later for the ones you nailed.
          </p>
        </div>
      ) : (
        <div className="card mt-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-bark-400">
              Daily goal
            </p>
            <p className="font-display text-sm font-extrabold text-bark-600">
              {Math.min(todayXp, DAILY_GOAL)} / {DAILY_GOAL} XP
            </p>
          </div>
          <ProgressBar
            value={goalValue}
            className="mt-2 h-4"
            barClassName={goalDone ? 'bg-fox-500' : 'bg-speeko-400'}
            label="Daily XP goal"
          />
          <p className="mt-2 text-sm font-semibold text-bark-500">
            {goalDone
              ? 'Daily goal complete — the fox is doing a little dance.'
              : `${DAILY_GOAL - todayXp} XP to hit today's goal.`}
          </p>
        </div>
      )}

      {!isReview && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-[#ffd9c2] bg-[#fff1e8] px-4 py-3 font-display text-sm font-extrabold text-fox-700">
          <FlameIcon className="h-5 w-5" />
          {streak > 0 ? `${streak} day streak` : 'Streak started'}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {nextLesson ? (
          <>
            <Link
              href={`/lesson/${course.id}/${nextLesson.lesson.id}`}
              className="btn-primary flex-1"
            >
              Next lesson
            </Link>
            <Link href={`/learn/${course.id}`} className="btn-secondary flex-1">
              Course path
            </Link>
          </>
        ) : (
          <Link href={`/learn/${course.id}`} className="btn-primary flex-1">
            Back to the course
          </Link>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'xp' | 'green' | 'streak';
}) {
  const tones = {
    xp: 'bg-[#fff9e0] text-[#a06b00] border-[#ffe9a8]',
    green: 'bg-speeko-50 text-speeko-700 border-speeko-200',
    streak: 'bg-[#fff1e8] text-fox-700 border-[#ffd9c2]',
  } as const;
  return (
    <div className={`rounded-2xl border-2 px-3 py-3 text-center ${tones[tone]}`}>
      <span className="mx-auto flex h-6 w-6 items-center justify-center">{icon}</span>
      <p className="mt-1 font-display text-xl font-extrabold leading-none sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
    </div>
  );
}

function OutOfHeartsScreen({
  course,
  entry,
  session,
  onRestart,
}: {
  course: Course;
  entry: FlatLesson;
  session: SessionState;
  onRestart: () => void;
}) {
  const accuracy = sessionAccuracy(session);
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="flex items-center gap-1" aria-label="No hearts left">
        {Array.from({ length: INITIAL_HEARTS }, (_, index) => (
          <HeartIcon key={index} filled={false} className="h-7 w-7 text-cream-300" />
        ))}
      </div>
      <Fox mood="sad" className="mt-2 h-40 w-40" />
      <h1 className="mt-2 font-display text-4xl font-extrabold text-bark-800">Out of hearts</h1>
      <p className="mt-2 max-w-md text-sm font-semibold text-bark-500">
        Hearts keep lessons focused. Take a breath, look at what tripped you up, and try{' '}
        {entry.lesson.title} again — the fox believes in you.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <div className="rounded-2xl border-2 border-cream-200 bg-white px-5 py-3 text-center shadow-card-sm">
          <p className="font-display text-2xl font-extrabold text-bark-800">
            {Math.round(accuracy * 100)}%
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-bark-400">
            Accuracy
          </p>
        </div>
        <div className="rounded-2xl border-2 border-cream-200 bg-white px-5 py-3 text-center shadow-card-sm">
          <p className="font-display text-2xl font-extrabold text-bark-800">
            {session.answers.length}
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-bark-400">
            Answered
          </p>
        </div>
      </div>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onRestart} className="btn-primary flex-1">
          Try this lesson again
        </button>
        <Link href={`/learn/${course.id}`} className="btn-secondary flex-1">
          <ArrowLeftIcon className="h-4 w-4" /> Course path
        </Link>
      </div>
    </main>
  );
}
