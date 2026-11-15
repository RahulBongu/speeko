import type { Lesson } from './content.js';
import type { Locale } from './locale.js';
import { gradeExercise, type AnswerInput, type GradeResult } from './grading.js';
import { xpForExercise } from './gamification.js';
import { INITIAL_HEARTS } from './session.js';
import { qualityForOutcome, skillIdFor } from './skills.js';
import type { SrsReview } from './progress.js';

/** Raw answer captured by a client for one exercise. */
export interface AttemptAnswer {
  exerciseId: string;
  input: AnswerInput;
  ms?: number | undefined;
}

/** An answer after the server (or client) re-grades it against the lesson. */
export interface GradedAnswer extends AttemptAnswer {
  correct: boolean;
  expected: string | null;
}

export interface AttemptScore {
  /** Graded answers in canonical lesson order. */
  answers: GradedAnswer[];
  /** XP from exercises only, before the lesson's completion bonus. */
  exerciseXp: number;
  /** Final XP, including the lesson bonus; 0 when the attempt failed. */
  xp: number;
  accuracy: number;
  heartsLeft: number;
  maxCombo: number;
  mistakes: string[];
  passed: boolean;
}

export type AttemptScoreResult =
  | { ok: true; score: AttemptScore }
  | { ok: false; reason: string };

/**
 * Re-grades a complete lesson attempt against authoritative content.
 *
 * The client sends raw answer inputs, never correct/XP claims. Answers are
 * matched to exercises by id, replayed in lesson order (so combo bonuses are
 * deterministic), and scored with the same rules the player uses.
 *
 * An attempt is complete only when it contains exactly one answer for every
 * exercise. Losing the last heart fails the attempt and awards nothing, which
 * matches the player's out-of-hearts screen.
 */
export function scoreLessonAttempt(
  lesson: Lesson,
  answers: AttemptAnswer[],
  hearts = INITIAL_HEARTS,
): AttemptScoreResult {
  const byExercise = new Map<string, AttemptAnswer>();
  for (const answer of answers) {
    if (byExercise.has(answer.exerciseId)) {
      return { ok: false, reason: `Duplicate answer for ${answer.exerciseId}` };
    }
    byExercise.set(answer.exerciseId, answer);
  }

  const exerciseIds = new Set(lesson.exercises.map((exercise) => exercise.id));
  for (const answer of answers) {
    if (!exerciseIds.has(answer.exerciseId)) {
      return { ok: false, reason: `Unknown exercise ${answer.exerciseId}` };
    }
  }
  if (answers.length !== lesson.exercises.length) {
    return { ok: false, reason: 'Every exercise must be answered exactly once' };
  }

  let heartsLeft = hearts;
  let combo = 0;
  let maxCombo = 0;
  let exerciseXp = 0;
  let correctCount = 0;
  const graded: GradedAnswer[] = [];
  const mistakes: string[] = [];

  for (const exercise of lesson.exercises) {
    const answer = byExercise.get(exercise.id);
    if (!answer) return { ok: false, reason: `Missing answer for ${exercise.id}` };

    const result: GradeResult = gradeExercise(exercise, answer.input);
    if (result.correct) {
      correctCount += 1;
      exerciseXp += xpForExercise(exercise.kind) + Math.min(combo, 4);
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
    } else {
      combo = 0;
      heartsLeft = Math.max(0, heartsLeft - 1);
      mistakes.push(exercise.id);
    }

    graded.push({
      ...answer,
      ms: Math.max(0, Math.floor(answer.ms ?? 0)),
      correct: result.correct,
      expected: result.expected,
    });
  }

  const passed = heartsLeft > 0;
  return {
    ok: true,
    score: {
      answers: graded,
      exerciseXp,
      xp: passed ? exerciseXp + lesson.xpReward : 0,
      accuracy: correctCount / lesson.exercises.length,
      heartsLeft,
      maxCombo,
      mistakes,
      passed,
    },
  };
}

/** Minimal outcome shape needed to schedule SRS reviews. */
export interface AnswerOutcome {
  exerciseId: string;
  correct: boolean;
}

/**
 * Builds the SRS outcomes for a graded attempt. One review per exercise, with
 * the same quality rule used by the web review mode.
 */
export function reviewsForAttempt(
  locale: Locale,
  exercises: Lesson['exercises'],
  answers: AnswerOutcome[],
): SrsReview[] {
  const byId = new Map(answers.map((answer) => [answer.exerciseId, answer]));
  const priorMisses = new Map<string, number>();
  const reviews: SrsReview[] = [];

  for (const exercise of exercises) {
    const answer = byId.get(exercise.id);
    if (!answer) continue;
    const skillId = skillIdFor(locale, exercise);
    if (!skillId) continue;
    const misses = priorMisses.get(exercise.id) ?? 0;
    reviews.push({ skillId, quality: qualityForOutcome(answer.correct, misses > 0) });
    if (!answer.correct) priorMisses.set(exercise.id, misses + 1);
  }

  return reviews;
}
