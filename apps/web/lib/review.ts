// Review mode for spaced repetition.
//
// Builds a short synthetic lesson out of the exercises whose skills are
// due for review. Review lessons reuse the real exercise content so the
// learner re-practices the exact items they know - just spaced correctly.

import {
  dueReviewCards,
  reviewsForAttempt,
  skillIdFor,
  type Course,
  type Exercise,
  type SessionState,
} from '@speeko/core';
import { flattenLessons } from '@/lib/courses';
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
 * Picks up to `limit` exercises from the course whose target-language skill
 * is due for review, earliest-due first. Returns an empty list when nothing
 * is due.
 */
export function buildReviewPlan(
  course: Course,
  progress: ProgressState,
  now = Date.now(),
  limit = REVIEW_SESSION_LIMIT,
): ReviewPlan {
  const due = dueReviewCards(progress, now);
  const dueSet = new Set(due.map((card) => card.skillId));
  if (dueSet.size === 0) return { exercises: [], dueCount: 0 };

  const picked: { exercise: Exercise; dueAt: number }[] = [];
  const seen = new Set<string>();
  for (const entry of flattenLessons(course)) {
    for (const exercise of entry.lesson.exercises) {
      const skillId = skillIdFor(course.locale, exercise);
      if (!skillId || !dueSet.has(skillId) || seen.has(exercise.id)) continue;
      const card = due.find((c) => c.skillId === skillId);
      picked.push({ exercise, dueAt: card?.dueAt ?? now });
      seen.add(exercise.id);
    }
  }

  picked.sort((a, b) => a.dueAt - b.dueAt);
  return { exercises: picked.slice(0, limit).map((entry) => entry.exercise), dueCount: dueSet.size };
}

/** Number of skills due for review in this course - used for the badge. */
export function dueReviewCount(
  course: Course,
  progress: ProgressState,
  now = Date.now(),
): number {
  const dueSet = new Set(dueReviewCards(progress, now).map((card) => card.skillId));
  if (dueSet.size === 0) return 0;
  let hits = 0;
  for (const entry of flattenLessons(course)) {
    for (const exercise of entry.lesson.exercises) {
      const skillId = skillIdFor(course.locale, exercise);
      if (skillId && dueSet.has(skillId)) hits += 1;
    }
  }
  return hits;
}
