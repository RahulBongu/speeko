// Practice planning.
//
// Everything here is derived from lessons the learner has actually completed
// and SRS cards already in their snapshot. Practice never invents items, never
// unlocks unseen lessons, and never awards XP.

import type { Course, Exercise } from './content.js';
import { lessonKey, type ProgressState } from './progress.js';
import { skillIdFor } from './skills.js';
import { isDue, MAX_BOX } from './srs.js';

export interface PracticePlan {
  exercises: Exercise[];
  /** Unique learned skills matching this practice mode, before the limit. */
  matched: number;
}

export interface UnitPracticeSummary {
  /** 1-based unit number, matching the lesson route. */
  index: number;
  id: string;
  title: string;
  description?: string;
  lessons: number;
  completedLessons: number;
  started: boolean;
  /** Exercises available from completed lessons in this unit. */
  learnedExercises: number;
}

export interface PracticeOverview {
  /** Unique learned skills currently due. */
  dueCount: number;
  /** Unique learned skills that have been missed at least once. */
  troubleCount: number;
  /** Learned skills in boxes 4-5 (8-16 day intervals). */
  masteredCount: number;
  /** Unique learned skills represented in the course. */
  learnedCount: number;
  /** Earliest future due time, or null when nothing is scheduled ahead. */
  nextDueAt: number | null;
  /** Card counts indexed by Leitner box (0 = new). */
  boxCounts: number[];
  units: UnitPracticeSummary[];
  hasPractice: boolean;
}

/**
 * Maps each learned skill to one real exercise. When progress is supplied,
 * only exercises from completed lessons are considered, so practice cannot
 * reveal items from lessons the learner has not reached.
 */
export function buildSkillExerciseIndex(
  course: Course,
  progress?: ProgressState,
): Map<string, Exercise> {
  const index = new Map<string, Exercise>();
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      if (progress && !progress.completed[lessonKey(course.id, lesson.id)]) continue;
      for (const exercise of lesson.exercises) {
        const skillId = skillIdFor(course.locale, exercise);
        if (skillId && !index.has(skillId)) index.set(skillId, exercise);
      }
    }
  }
  return index;
}

function learnedCards(course: Course, progress: ProgressState) {
  const index = buildSkillExerciseIndex(course, progress);
  const cards = Object.values(progress.srs).filter((card) => index.has(card.skillId));
  return { index, cards };
}

function planFromCards(
  index: Map<string, Exercise>,
  cards: { skillId: string }[],
  limit: number,
): PracticePlan {
  if (limit <= 0) return { exercises: [], matched: cards.length };
  const exercises: Exercise[] = [];
  for (const card of cards) {
    const exercise = index.get(card.skillId);
    if (exercise) exercises.push(exercise);
    if (exercises.length >= limit) break;
  }
  return { exercises, matched: cards.length };
}

/** Due cards, earliest first, one real exercise per skill. */
export function buildDuePracticePlan(
  course: Course,
  progress: ProgressState,
  now = Date.now(),
  limit = 10,
): PracticePlan {
  const { index, cards } = learnedCards(course, progress);
  const due = cards
    .filter((card) => isDue(card, now))
    .sort((a, b) => a.dueAt - b.dueAt);
  return planFromCards(index, due, limit);
}

/**
 * Cards the learner has missed before, most-lapsed first. These may not be
 * due yet, but revisiting them is always allowed.
 */
export function buildTroublePracticePlan(
  course: Course,
  progress: ProgressState,
  limit = 10,
): PracticePlan {
  const { index, cards } = learnedCards(course, progress);
  const trouble = cards
    .filter((card) => card.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses || a.dueAt - b.dueAt);
  return planFromCards(index, trouble, limit);
}

/**
 * A deterministic mix from a unit's completed lessons. Exercises are taken
 * round-robin so every completed lesson contributes before any lesson gets a
 * second turn.
 */
export function buildUnitPracticePlan(
  course: Course,
  progress: ProgressState,
  unitIndex: number,
  limit = 10,
): PracticePlan {
  const unit = course.units[unitIndex - 1];
  if (!unit) return { exercises: [], matched: 0 };

  const completed = unit.lessons.filter(
    (lesson) => progress.completed[lessonKey(course.id, lesson.id)],
  );
  const buckets = completed.map((lesson) => lesson.exercises).filter((items) => items.length > 0);
  const matched = buckets.reduce((total, items) => total + items.length, 0);
  if (limit <= 0 || buckets.length === 0) return { exercises: [], matched };

  const exercises: Exercise[] = [];
  for (let round = 0; exercises.length < limit; round += 1) {
    let added = false;
    for (const bucket of buckets) {
      const exercise = bucket[round];
      if (!exercise) continue;
      exercises.push(exercise);
      added = true;
      if (exercises.length >= limit) break;
    }
    if (!added) break;
  }
  return { exercises, matched };
}

/** Honest hub numbers: every count comes from completed lessons and cards. */
export function practiceOverview(
  course: Course,
  progress: ProgressState,
  now = Date.now(),
): PracticeOverview {
  const { cards } = learnedCards(course, progress);
  const boxCounts = Array.from({ length: MAX_BOX + 1 }, () => 0);
  for (const card of cards) {
    boxCounts[card.box] = (boxCounts[card.box] ?? 0) + 1;
  }

  const future = cards
    .filter((card) => card.dueAt > now)
    .sort((a, b) => a.dueAt - b.dueAt);

  const units = course.units.map((unit, index): UnitPracticeSummary => {
    const completedLessons = unit.lessons.filter(
      (lesson) => progress.completed[lessonKey(course.id, lesson.id)],
    ).length;
    const learnedExercises = unit.lessons
      .filter((lesson) => progress.completed[lessonKey(course.id, lesson.id)])
      .reduce((total, lesson) => total + lesson.exercises.length, 0);
    return {
      index: index + 1,
      id: unit.id,
      title: unit.title,
      ...(unit.description ? { description: unit.description } : {}),
      lessons: unit.lessons.length,
      completedLessons,
      started: completedLessons > 0,
      learnedExercises,
    };
  });

  return {
    dueCount: cards.filter((card) => isDue(card, now)).length,
    troubleCount: cards.filter((card) => card.lapses > 0).length,
    masteredCount: cards.filter((card) => card.box >= 4).length,
    learnedCount: cards.length,
    nextDueAt: future[0]?.dueAt ?? null,
    boxCounts,
    units,
    hasPractice: cards.length > 0 || units.some((unit) => unit.started),
  };
}
