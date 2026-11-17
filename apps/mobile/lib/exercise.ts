import type { AnswerInput, Exercise } from '@speeko/core';
import { xpForExercise } from '@speeko/core';

/**
 * Answer shapes the mobile app can capture. These mirror the web player's
 * drafts, but the mobile build only renders the exercise kinds the published
 * course bundles actually contain.
 */
export type DraftAnswer =
  | { kind: 'choice'; index: number | null }
  | { kind: 'text'; value: string }
  | { kind: 'pairs'; mismatches: number; matched: number }
  | { kind: 'tokens'; value: number[] };

/**
 * Exercise kinds the mobile player renders. Anything else is shown as an
 * honest unsupported state and can never be submitted or counted toward a
 * lesson completion.
 */
export const SUPPORTED_EXERCISE_KINDS = [
  'chooseMeaning',
  'listenChoose',
  'fillBlank',
  'typeTranslation',
  'matchPairs',
] as const;

export type SupportedExerciseKind = (typeof SUPPORTED_EXERCISE_KINDS)[number];

export function isSupportedExercise(exercise: Exercise | null | undefined): boolean {
  return Boolean(
    exercise &&
      (SUPPORTED_EXERCISE_KINDS as readonly string[]).includes(exercise.kind),
  );
}

export function initialDraft(exercise: Exercise): DraftAnswer {
  if (choiceOptions(exercise)) return { kind: 'choice', index: null };
  switch (exercise.kind) {
    case 'typeTranslation':
    case 'typeWhatYouHear':
      return { kind: 'text', value: '' };
    case 'matchPairs':
      return { kind: 'pairs', mismatches: 0, matched: 0 };
    default:
      return { kind: 'text', value: '' };
  }
}

/**
 * Choice-based exercises include listening and fill-in-the-blank; both are
 * graded as a choice index in `@speeko/core`, never as free text.
 */
export function choiceOptions(exercise: Exercise): string[] | null {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank':
    case 'chooseImage':
      return exercise.options;
    default:
      return null;
  }
}

export function canSubmit(exercise: Exercise, draft: DraftAnswer): boolean {
  if (!isSupportedExercise(exercise)) return false;
  switch (draft.kind) {
    case 'choice':
      return draft.index !== null;
    case 'text':
      return draft.value.trim().length > 0;
    case 'pairs':
      return (
        exercise.kind === 'matchPairs' &&
        draft.matched >= exercise.pairs.length &&
        draft.mismatches >= 0
      );
    case 'tokens':
      return draft.value.length > 0;
    default:
      return false;
  }
}

export function toAnswerInput(
  exercise: Exercise,
  draft: DraftAnswer,
): AnswerInput | null {
  if (!canSubmit(exercise, draft)) return null;
  switch (draft.kind) {
    case 'choice':
      return draft.index === null ? null : { kind: 'choice', index: draft.index };
    case 'text':
      return { kind: 'text', value: draft.value };
    case 'pairs':
      return { kind: 'pairs', mismatches: draft.mismatches };
    case 'tokens': {
      if (exercise.kind !== 'wordBank' && exercise.kind !== 'arrangeSentence') {
        return null;
      }
      const pool = exercise.kind === 'wordBank' ? exercise.words : exercise.tiles;
      const value = draft.value
        .map((index) => pool[index])
        .filter((token): token is string => typeof token === 'string');
      if (value.length !== draft.value.length || value.length === 0) return null;
      return { kind: 'tokens', value };
    }
    default:
      return null;
  }
}

/**
 * Deterministic right-column order for a match-pairs board, so the same
 * exercise looks the same every time it is opened (and tests are stable).
 */
export function matchPairOrder(pairs: readonly (readonly [string, string])[], seed: string): number[] {
  const keyed = pairs.map((pair, index) => {
    const text = `${seed}:${index}:${pair[1]}`;
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return { index, hash };
  });
  keyed.sort((a, b) => a.hash - b.hash || a.index - b.index);
  return keyed.map((entry) => entry.index);
}

/** Target-language text shown when a choice answer is revealed. */
export function expectedChoice(exercise: Exercise): string | null {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank':
      return exercise.options[exercise.answerIndex] ?? null;
    default:
      return null;
  }
}

/**
 * Exercise XP for a finished attempt. Matches the web session reducer: only
 * correct answers earn exercise XP; the lesson bonus is added by the caller.
 */
export function earnedExerciseXp(
  exercises: readonly Exercise[],
  outcomes: readonly { exerciseId: string; correct: boolean }[],
): number {
  const correct = new Set(
    outcomes.filter((outcome) => outcome.correct).map((outcome) => outcome.exerciseId),
  );
  return exercises.reduce(
    (total, exercise) =>
      correct.has(exercise.id) ? total + xpForExercise(exercise.kind) : total,
    0,
  );
}
