// Review mode for spaced repetition.
//
// Builds a short synthetic lesson out of the exercises whose skills are due.
// Review lessons reuse the real exercise content so the learner re-practices
// the exact items they know - just spaced correctly. Planning is shared with
// the practice hub in `@speeko/core`.

import {
  buildDuePracticePlan,
  reviewsForAttempt,
  type Course,
  type Exercise,
  type SessionState,
} from '@speeko/core';
import type { ProgressState } from '@/lib/progress';

/** Map an answered session to SRS reviews: one per answered exercise. */
export function buildReviewsFromAnswers(
  session: SessionState,
  locale: Course['locale'],
): { skillId: string; quality: number }[] {
  return reviewsForAttempt(locale, session.exercises, session.answers);
}

export interface ReviewPlan {
  exercises: Exercise[];
  dueCount: number;
}

/** How many exercises a review session contains. */
export const REVIEW_SESSION_LIMIT = 10;

/**
 * Picks up to `limit` real exercises whose target-language skill is due,
 * earliest-due first. Returns an empty list when nothing is due.
 */
export function buildReviewPlan(
  course: Course,
  progress: ProgressState,
  now = Date.now(),
  limit = REVIEW_SESSION_LIMIT,
): ReviewPlan {
  const plan = buildDuePracticePlan(course, progress, now, limit);
  return { exercises: plan.exercises, dueCount: plan.matched };
}

/** Number of learned words due for review - used for badges and CTAs. */
export function dueReviewCount(
  course: Course,
  progress: ProgressState,
  now = Date.now(),
): number {
  return buildDuePracticePlan(course, progress, now, 0).matched;
}
