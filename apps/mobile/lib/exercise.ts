import type { AnswerInput, Exercise } from '@speeko/core';
import { xpForExercise } from '@speeko/core';

/**
 * Answer shapes the mobile app can capture. These mirror the web player's
 * drafts. The mobile build renders chooseMeaning, listenChoose, fillBlank,
 * typeTranslation, typeWhatYouHear, matchPairs, wordBank and arrangeSentence,
 * plus speak in a fallback-only mode (no microphone — the learner types what
 * they said, or self-reports saying it out loud). chooseImage remains blocked
 * and is shown as an honest unsupported state.
 */
export type DraftAnswer =
  | { kind: 'choice'; index: number | null }
  | { kind: 'text'; value: string }
  | { kind: 'pairs'; mismatches: number; matched: number }
  | { kind: 'tokens'; value: number[] }
  | { kind: 'speak'; transcript: string; selfReported: boolean };

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
  'wordBank',
  'arrangeSentence',
  'typeWhatYouHear',
  'speak',
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
    case 'wordBank':
    case 'arrangeSentence':
      return { kind: 'tokens', value: [] };
    case 'speak':
      return { kind: 'speak', transcript: '', selfReported: false };
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
    case 'speak':
      return draft.transcript.trim().length > 0 || draft.selfReported;
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
      const pool = getTokenPool(exercise);
      if (!pool) return null;
      const value = draft.value
        .map((index) => pool[index])
        .filter((token): token is string => typeof token === 'string');
      if (value.length !== draft.value.length || value.length === 0) return null;
      return { kind: 'tokens', value };
    }
    case 'speak':
      return {
        kind: 'speak',
        transcript: draft.transcript,
        selfReported: draft.selfReported,
      };
    default:
      return null;
  }
}

/**
 * The pool of tokens a token board can offer, in content order. wordBank
 * draws from `words`, arrangeSentence from `tiles`; anything else has no pool.
 */
export function getTokenPool(exercise: Exercise): string[] | null {
  switch (exercise.kind) {
    case 'wordBank':
      return exercise.words;
    case 'arrangeSentence':
      return exercise.tiles;
    default:
      return null;
  }
}

/**
 * Deterministic shuffle for a token pool: the same exercise id always yields
 * the same display order, so boards render identically on every open and
 * tests stay stable. FNV-1a seeded by the exercise id feeds a Fisher-Yates
 * pass. Implemented fresh here — no cross-imports from the web player.
 */
export function deterministicShuffle<T>(pool: readonly T[], exerciseId: string): T[] {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < exerciseId.length; i += 1) {
    hash = Math.imul(hash ^ exerciseId.charCodeAt(i), 16777619) >>> 0;
  }
  const indexes = Array.from({ length: pool.length }, (_, index) => index);
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0;
    const j = Math.abs(hash) % (i + 1);
    const current = indexes[i]!;
    indexes[i] = indexes[j]!;
    indexes[j] = current;
  }
  return indexes.map((index) => pool[index]!);
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
