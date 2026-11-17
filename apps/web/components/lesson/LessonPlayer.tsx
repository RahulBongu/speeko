'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  accuracy as sessionAccuracy,
  buildTroublePracticePlan,
  buildUnitPracticePlan,
  createSession,
  currentExercise,
  eligibleExercises,
  gradeExercise,
  INITIAL_HEARTS,
  reduceSession,
  type Course,
  type Exercise,
  type GradeResult,
  type SessionState,
  type AttemptAnswer,
} from '@speeko/core';
import { fetchCourse, findLesson, flattenLessons, type FlatLesson } from '@/lib/courses';
import {
  DAILY_GOAL,
  applyReviews,
  isLessonCompleted,
  loadProgress,
  recordCompletionAndReviews,
  saveProgress,
  type ProgressState,
} from '@/lib/progress';
import { buildReviewPlan, buildReviewsFromAnswers } from '@/lib/review';
import { checkUnitPractice, isPracticeLessonId, practiceKind } from '@/lib/practice';
import { authClient } from '@/lib/auth-client';
import { readKnownSignedInUserId } from '@/lib/auth-marker';
import { submitLessonCompletion } from '@/lib/sync';
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

type SaveState =
  | { status: 'idle' }
  | { status: 'local' }
  | { status: 'saving' }
  | { status: 'saved'; xp: number; rewarded: boolean }
  | { status: 'error'; message: string };

function newAttemptId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `attempt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Count from 0 to `target` — instantly under prefers-reduced-motion. */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -4 * t); // easeOutExpo
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

const TIPS = [
  'Take your time — accuracy beats speed.',
  'Say each answer out loud as you tap it.',
  'Mistakes are data. The fox is not judging.',
  'One lesson a day keeps the streak alive.',
];

/**
 * Builds a synthetic, practice-only lesson entry from real exercises. The
 * entry never matches a course lesson, so it cannot award XP or completion.
 */
function syntheticEntry({
  id,
  title,
  description,
  exercises,
  order,
  difficulty,
}: {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  order: number;
  difficulty: Course['difficulty'];
}): FlatLesson {
  return {
    lesson: {
      id,
      title,
      description,
      order,
      difficulty,
      xpReward: 0,
      reviewStatus: 'draft',
      exercises,
    },
    unit: {
      id: `practice:${id}`,
      title: 'Practice',
      description: 'Practice only — no XP and no new lessons.',
      order,
      crownLevel: 0,
      reviewStatus: 'draft',
      lessons: [],
    },
    index: order,
  };
}

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
  const exitDialogRef = useRef<HTMLDivElement | null>(null);
  const keepPracticingRef = useRef<HTMLButtonElement | null>(null);
  const exitRestoreRef = useRef<HTMLElement | null>(null);
  const [postProgress, setPostProgress] = useState<ProgressState | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const { data: authSession, isPending: authPending, error: authError } = authClient.useSession();
  const userId = authSession?.user.id ?? null;
  /** The route itself is practice-only, regardless of loaded entry state. */
  const practiceRoute = isPracticeLessonId(lessonId);

  const shownAt = useRef(Date.now());
  const savedRef = useRef(false);
  const savingRef = useRef(false);
  const attemptId = useRef(newAttemptId());
  const attemptAnswers = useRef<AttemptAnswer[]>([]);

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
    savingRef.current = false;
    attemptId.current = newAttemptId();
    attemptAnswers.current = [];
    setSaveState({ status: 'idle' });

    fetchCourse(courseId)
      .then((loaded) => {
        if (cancelled) return;
        const checkpointMatch = /^checkpoint-unit-(\d+)$/.exec(lessonId);
        const unitPracticeMatch = /^practice-unit-(\d+)$/.exec(lessonId);
        let found: FlatLesson | null = null;
        if (checkpointMatch) {
          const unitNumber = Number(checkpointMatch[1]);
          if (
            !Number.isInteger(unitNumber) ||
            unitNumber < 1 ||
            unitNumber > loaded.units.length ||
            unitNumber % 2 !== 0
          ) {
            setError('That checkpoint does not exist in this course.');
            setPhase('error');
            return;
          }
          const priorUnits = loaded.units.slice(0, unitNumber);
          const priorLessons = priorUnits.flatMap((unit) => unit.lessons);
          const progress = loadProgress();
          if (
            priorLessons.length === 0 ||
            !priorLessons.every((lesson) => isLessonCompleted(progress, loaded.id, lesson.id))
          ) {
            setError(`Finish units 1–${unitNumber} before this checkpoint.`);
            setPhase('error');
            return;
          }
          const exercises = eligibleExercises(
            priorLessons.flatMap((lesson) => lesson.exercises),
          ).slice(0, 8);
          found = syntheticEntry({
            id: lessonId,
            title: `Checkpoint · Unit ${unitNumber}`,
            description: `${priorLessons.length} lessons' worth of practice, no XP at stake.`,
            exercises,
            order: 999 + unitNumber,
            difficulty: loaded.difficulty,
          });
        } else if (lessonId === 'review') {
          const progress = loadProgress();
          const plan = buildReviewPlan(loaded, progress, Date.now());
          const reviewExercises = eligibleExercises(plan.exercises);
          if (reviewExercises.length === 0) {
            setError('Nothing is due for review yet. Come back after a few lessons.');
            setPhase('error');
            return;
          }
          found = syntheticEntry({
            id: 'review',
            title: 'Review',
            description: 'Re-practice the skills you are about to forget.',
            exercises: reviewExercises,
            order: 999,
            difficulty: loaded.difficulty,
          });
        } else if (unitPracticeMatch) {
          const unitNumber = Number(unitPracticeMatch[1]);
          const progress = loadProgress();
          const check = checkUnitPractice(loaded, progress, lessonId);
          const unit = loaded.units[unitNumber - 1];
          if (!check.ok || !unit) {
            setError(check.reason ?? 'That unit practice does not exist in this course.');
            setPhase('error');
            return;
          }
          const plan = buildUnitPracticePlan(loaded, progress, unitNumber);
          found = syntheticEntry({
            id: lessonId,
            title: unit.title,
            description: `A quick mix from the ${unit.title} lessons you have finished.`,
            exercises: eligibleExercises(plan.exercises),
            order: 900 + unitNumber,
            difficulty: loaded.difficulty,
          });
        } else if (lessonId === 'practice-trouble') {
          const progress = loadProgress();
          const plan = buildTroublePracticePlan(loaded, progress);
          const troubleExercises = eligibleExercises(plan.exercises);
          if (troubleExercises.length === 0) {
            setError('No trouble words yet. A word lands here after you miss it at least once.');
            setPhase('error');
            return;
          }
          found = syntheticEntry({
            id: 'practice-trouble',
            title: 'Trouble words',
            description: 'The words you have missed before — another pass, no XP.',
            exercises: troubleExercises,
            order: 998,
            difficulty: loaded.difficulty,
          });
        } else {
          found = findLesson(loaded, lessonId);
        }
        if (!found) {
          setError('That lesson does not exist in this course.');
          setPhase('error');
          return;
        }
        const playable = eligibleExercises(found.lesson.exercises);
        const first = playable[0];
        if (!first) {
          setError('This lesson has no exercises yet.');
          setPhase('error');
          return;
        }
        setCourse(loaded);
        setEntry(found);
        setSession(createSession(found.lesson.id, playable, Date.now()));
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
    attemptAnswers.current.push({ exerciseId: exerciseNow.id, input, ms: elapsed });
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
    const restartable = eligibleExercises(entry.lesson.exercises);
    const first = restartable[0];
    if (!first) return;
    setSession(createSession(entry.lesson.id, restartable, Date.now()));
    setDraft(initialDraft(first));
    setGrade(null);
    setAnsweredExercise(null);
    setXpGained(0);
    setPostProgress(null);
    savedRef.current = false;
    savingRef.current = false;
    attemptId.current = newAttemptId();
    attemptAnswers.current = [];
    setSaveState({ status: 'idle' });
    shownAt.current = Date.now();
    setPhase('playing');
  }, [entry]);

  const persistAttempt = useCallback(
    async (answers: AttemptAnswer[]) => {
      if (
        !session ||
        !course ||
        !entry ||
        isPracticeLessonId(entry.lesson.id)
      ) {
        return;
      }
      if (savingRef.current) return;
      savingRef.current = true;
      setSaveState({ status: 'saving' });
      try {
        const result = await submitLessonCompletion({
          attemptId: attemptId.current,
          courseId: course.id,
          lessonId: entry.lesson.id,
          answers,
        });
        saveProgress(result.progress);
        setPostProgress(result.progress);
        setSaveState({
          status: 'saved',
          xp: result.completion.xp,
          rewarded: result.completion.rewarded,
        });
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : 'Check your connection and try again.';
        setSaveState({
          status: 'error',
          message: message.endsWith('.') ? message : `${message}.`,
        });
      } finally {
        savingRef.current = false;
      }
    },
    [session, course, entry],
  );

  useEffect(() => {
    if (phase !== 'summary' || savedRef.current || !session || !course || !entry) return;
    // Wait for the auth check so a signed-in learner never falls back to a
    // local, unverified award.
    const isPractice = isPracticeLessonId(entry.lesson.id);
    if (!isPractice && authPending) return;
    savedRef.current = true;

    const reviews = buildReviewsFromAnswers(session, course.locale);

    // A failed session check is ambiguous. Fail closed for a browser that
    // was signed in; otherwise treat the learner as an offline guest.
    if (!isPractice && authError && !userId && readKnownSignedInUserId()) {
      setSaveState({
        status: 'error',
        message: 'Could not check your account. Check your connection and try again.',
      });
      return;
    }

    if (isPractice || !userId) {
      const updated = isPractice
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
      setSaveState({ status: 'local' });
      return;
    }

    void persistAttempt(attemptAnswers.current);
  }, [phase, session, course, entry, authPending, authError, userId, persistAttempt]);

  const retrySave = useCallback(() => {
    if (!session || !course || !entry || savingRef.current) return;
    void persistAttempt(attemptAnswers.current);
  }, [session, course, entry, persistAttempt]);

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

  // Exit dialog: move focus to the safe action on open, trap Tab inside,
  // and hand focus back to the quit button on close.
  useEffect(() => {
    if (!showExit) return undefined;
    exitRestoreRef.current = document.activeElement as HTMLElement | null;
    keepPracticingRef.current?.focus();
    return () => {
      const target = exitRestoreRef.current;
      exitRestoreRef.current = null;
      target?.focus();
    };
  }, [showExit]);

  const trapExitTab = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const dialog = exitDialogRef.current;
    if (!dialog) return;
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href]'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !dialog.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }, []);

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
          <Link
            href={practiceRoute ? '/practice' : `/learn/${courseId}`}
            className="btn-primary"
          >
            {practiceRoute ? 'Back to practice' : 'Back to the course'}
          </Link>
          <Link href={practiceRoute ? `/learn/${courseId}` : '/learn'} className="btn-secondary">
            {practiceRoute ? 'Open course path' : 'All languages'}
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
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-gold-100 px-2 py-1 font-display text-xs font-extrabold text-gold-700">
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
          saveState={saveState}
          onRetry={retrySave}
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
            <p className="font-display text-xs font-extrabold uppercase tracking-[0.16em] text-bark-500">
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
              <p className="hidden text-xs font-semibold text-bark-400 sm:block">
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
          isPractice={practiceRoute}
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
            ref={exitDialogRef}
            onKeyDown={trapExitTab}
            onClick={(event) => event.stopPropagation()}
          >
            <Fox className="mx-auto h-24 w-24" />
            <h2 id="exit-title" className="mt-2 font-display text-2xl font-extrabold text-bark-800">
              {practiceRoute ? 'Leave this practice?' : 'Leave this lesson?'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-bark-500">
              {practiceRoute
                ? "Answers from this session won't be saved. Your review schedule only changes when you finish."
                : "Your answers so far won't be saved. You can restart any time."}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="btn-primary" ref={keepPracticingRef} onClick={() => setShowExit(false)}>
                Keep practicing
              </button>
              <Link href={practiceRoute ? '/practice' : `/learn/${course.id}`} className="btn-secondary">
                {practiceRoute ? 'Leave practice' : 'Leave lesson'}
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
  isPractice,
  onContinue,
}: {
  correct: boolean;
  expected: string | null;
  xpGained: number;
  combo: number;
  isLast: boolean;
  isPractice: boolean;
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
          <Fox mood={correct ? 'happy' : 'sad'} className="hidden h-14 w-14 shrink-0 animate-bob sm:block" />
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
                <span className="inline-block animate-pop">
                  {isPractice
                    ? 'Review scheduled'
                    : xpGained > 0
                      ? `+${xpGained} XP`
                      : 'Progress saved'}
                </span>
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
  saveState,
  onRetry,
}: {
  course: Course;
  entry: FlatLesson;
  session: SessionState;
  postProgress: ProgressState | null;
  nextLesson: FlatLesson | null;
  saveState: SaveState;
  onRetry: () => void;
}) {
  const accuracy = sessionAccuracy(session);
  const kind = practiceKind(entry.lesson.id);
  const isPractice = kind !== 'lesson';
  const practiceReplay =
    !isPractice && saveState.status === 'saved' && !saveState.rewarded;
  const heading = practiceReplay
    ? 'Practice complete!'
    : kind === 'review'
      ? 'Review complete!'
      : kind === 'checkpoint'
        ? 'Checkpoint complete!'
        : kind === 'trouble'
          ? 'Trouble words done!'
          : kind === 'unit'
            ? 'Unit practice complete!'
            : 'Lesson complete!';
  const subtitle =
    kind === 'review'
      ? 'Spaced repetition'
      : kind === 'checkpoint'
        ? 'Practice, no XP'
        : kind === 'trouble'
          ? 'Trouble words · no XP'
          : kind === 'unit'
            ? 'Unit practice · no XP'
            : entry.lesson.title;
  const localXp = session.xp + (isPractice ? 0 : entry.lesson.xpReward);
  const awardedXp = !isPractice && saveState.status === 'saved' ? saveState.xp : localXp;
  const todayXp = postProgress?.todayXp ?? 0;
  const streak = postProgress?.streak ?? 0;
  const dailyGoal = postProgress?.dailyGoal ?? DAILY_GOAL;
  const goalValue = Math.min(1, todayXp / dailyGoal);
  const goalDone = todayXp >= dailyGoal;
  const displayXp = useCountUp(awardedXp);
  const displayAccuracy = useCountUp(Math.round(accuracy * 100));
  const displayCombo = useCountUp(session.maxCombo);

  return (
    <main className="relative mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="text-center">
        <div className="relative mx-auto h-44 w-44">
          <div className="absolute inset-0 animate-pop rounded-full bg-gradient-to-br from-fox-300/70 to-speeko-200/70 blur-xl" />
          <Fox mood="celebrate" className="relative h-44 w-44 animate-pop" />
        </div>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-bark-800">
          {heading}
        </h1>
        <p className="mt-1 font-semibold text-bark-500">
          {subtitle} · {course.title}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="animate-rise [animation-delay:120ms]">
          <StatCard
            label={
              isPractice ? 'Exercises replayed' : practiceReplay ? 'Practice only' : 'XP earned'
            }
            value={
              isPractice
                ? `${session.answers.length}`
                : practiceReplay
                  ? 'No new XP'
                  : `+${displayXp}`
            }
            icon={<TrophyIcon className="h-5 w-5" />}
            tone="xp"
          />
        </div>
        <div className="animate-rise [animation-delay:220ms]">
          <StatCard label="Accuracy" value={`${displayAccuracy}%`} icon={<CheckIcon className="h-5 w-5" />} tone="green" />
        </div>
        <div className="animate-rise [animation-delay:320ms]">
          <StatCard label="Best combo" value={`×${displayCombo}`} icon={<BoltIcon className="h-5 w-5" />} tone="streak" />
        </div>
      </div>

      {!isPractice && saveState.status === 'saving' ? (
        <p
          role="status"
          className="mt-4 rounded-2xl border-2 border-cream-200 bg-white px-4 py-3 text-center text-sm font-semibold text-bark-500"
        >
          Saving your reward…
        </p>
      ) : null}
      {!isPractice && saveState.status === 'local' ? (
        <p
          role="status"
          className="mt-4 rounded-2xl border-2 border-cream-200 bg-white px-4 py-3 text-center text-sm font-semibold text-bark-500"
        >
          Saved on this device.
        </p>
      ) : null}
      {!isPractice && saveState.status === 'saved' ? (
        <p
          role="status"
          className="mt-4 rounded-2xl border-2 border-speeko-200 bg-speeko-50 px-4 py-3 text-center text-sm font-extrabold text-speeko-700"
        >
          {saveState.rewarded
            ? 'Reward saved to your account.'
            : 'Lesson saved — practice only, no new completion XP.'}
        </p>
      ) : null}
      {!isPractice && saveState.status === 'error' ? (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-fox-200 bg-fox-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-display text-sm font-extrabold text-fox-700">
              Reward not saved
            </p>
            <p className="mt-1 text-sm font-semibold text-bark-500">
              {saveState.message} Retry to save this lesson — if you leave now, it
              won&apos;t be counted.
            </p>
          </div>
          <button type="button" onClick={onRetry} className="btn-secondary shrink-0">
            Retry
          </button>
        </div>
      ) : null}

      {isPractice ? (
        <div className="card mt-4 p-5 text-center">
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-bark-500">
            {kind === 'review'
              ? 'Spaced repetition'
              : kind === 'checkpoint'
                ? 'Practice check'
                : 'Practice only'}
          </p>
          <p className="mt-2 text-sm font-semibold text-bark-500">
            {kind === 'review'
              ? 'Cards you practiced are now scheduled for their next review — sooner for the ones you missed, later for the ones you nailed.'
              : kind === 'checkpoint'
                ? 'No XP is at stake here — it is a chance to prove the units stuck. The answers do count toward your review schedule.'
                : 'No XP and no course progress here. The answers still move each word through its review box.'}
          </p>
        </div>
      ) : postProgress ? (
        <div className="card mt-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-bark-500">
              Daily goal
            </p>
            <p className="font-display text-sm font-extrabold text-bark-600">
              {Math.min(todayXp, dailyGoal)} / {dailyGoal} XP
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
              : `${dailyGoal - todayXp} XP to hit today's goal.`}
          </p>
        </div>
      ) : (
        <div className="card mt-4 p-5 text-center">
          <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-bark-500">
            Daily goal
          </p>
          <p className="mt-2 text-sm font-semibold text-bark-500">
            Your daily goal and streak update when this lesson is saved.
          </p>
        </div>
      )}

      {!isPractice && postProgress ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-fox-200 bg-fox-100 px-4 py-3 font-display text-sm font-extrabold text-fox-700">
          <FlameIcon className="h-5 w-5 animate-bob" />
          {streak > 0 ? `${streak} day streak` : 'Streak started'}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {isPractice ? (
          <>
            <Link
              href={`/lesson/${course.id}/${entry.lesson.id}`}
              className="btn-primary flex-1"
            >
              Practice again
            </Link>
            <Link href="/practice" className="btn-secondary flex-1">
              Practice hub
            </Link>
          </>
        ) : nextLesson ? (
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
    xp: 'bg-gold-100 text-gold-700 border-gold-200',
    green: 'bg-speeko-50 text-speeko-700 border-speeko-200',
    streak: 'bg-fox-100 text-fox-700 border-fox-200',
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
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500">
            Accuracy
          </p>
        </div>
        <div className="rounded-2xl border-2 border-cream-200 bg-white px-5 py-3 text-center shadow-card-sm">
          <p className="font-display text-2xl font-extrabold text-bark-800">
            {session.answers.length}
          </p>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-bark-500">
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
