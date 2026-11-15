import { emptyProgress, lessonKey, migrateProgress, todayKey, updateStreak, dueReviewCards, applyReviews, type Course } from '@speeko/core';
import type { CompletionInput, LessonRecord, ProgressState } from '@speeko/core';
import { flattenLessons } from './courses';

export { DAILY_GOAL, emptyProgress, dueReviewCards, applyReviews, lessonKey, todayKey } from '@speeko/core';
export type { LessonRecord, ProgressState } from '@speeko/core';

export const PROGRESS_KEY = 'speeko.progress.v2';
/** Legacy key. Read forever so existing guests never lose their progress. */
export const LEGACY_PROGRESS_KEY = 'speeko.progress.v1';
export const PROGRESS_EVENT = 'speeko:progress';

export type LessonStatus = 'completed' | 'current' | 'locked';

export interface CourseStats {
  total: number;
  completed: number;
  nextLessonId: string | null;
  allComplete: boolean;
}

export function loadProgress(now = new Date()): ProgressState {
  if (typeof window === 'undefined') return emptyProgress(now);
  try {
    const raw =
      window.localStorage.getItem(PROGRESS_KEY) ??
      window.localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!raw) return emptyProgress(now);
    return migrateProgress(JSON.parse(raw), now);
  } catch {
    return emptyProgress(now);
  }
}

export function saveProgress(progress: ProgressState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent<ProgressState>(PROGRESS_EVENT, { detail: progress }));
}

export function recordCompletion(
  progress: ProgressState,
  input: CompletionInput,
  now = new Date(),
): ProgressState {
  const today = todayKey(now);
  const base: ProgressState =
    progress.todayDate === today ? progress : { ...progress, todayDate: today, todayXp: 0 };
  const key = lessonKey(input.courseId, input.lessonId);
  const previous = base.completed[key];
  const accuracy = Math.max(0, Math.min(1, input.accuracy));
  const record: LessonRecord = {
    courseId: input.courseId,
    lessonId: input.lessonId,
    completedAt: now.toISOString(),
    accuracy: Math.max(previous?.accuracy ?? 0, accuracy),
    xp: (previous?.xp ?? 0) + Math.max(0, input.xp),
  };
  const streak = updateStreak(base.lastActiveDate, today, base.streak, false);
  return {
    ...base,
    xp: base.xp + Math.max(0, input.xp),
    streak: streak.streak,
    lastActiveDate: today,
    todayXp: base.todayXp + Math.max(0, input.xp),
    completed: { ...base.completed, [key]: record },
    lastCourseId: input.courseId,
    lastLessonId: input.lessonId,
  };
}

/**
 * Records a finished lesson (XP/streak/completion) AND applies the SRS
 * outcomes for every answered exercise. This is the single write path used
 * by lesson completion and review sessions.
 */
export function recordCompletionAndReviews(
  progress: ProgressState,
  input: CompletionInput,
  reviews: { skillId: string; quality: number }[],
  now = new Date(),
): ProgressState {
  const completed = recordCompletion(progress, input, now);
  return applyReviews(completed, reviews, now.getTime());
}

export function isLessonCompleted(
  progress: ProgressState,
  courseId: string,
  lessonId: string,
): boolean {
  return Boolean(progress.completed[lessonKey(courseId, lessonId)]);
}

export function completedInCourse(progress: ProgressState, courseId: string): number {
  return Object.values(progress.completed).filter((record) => record.courseId === courseId).length;
}

export function isLessonUnlocked(
  course: Course,
  lessonId: string,
  progress: ProgressState,
): boolean {
  const flat = flattenLessons(course);
  const index = flat.findIndex((entry) => entry.lesson.id === lessonId);
  if (index < 0) return false;
  if (index === 0) return true;
  const previous = flat[index - 1];
  if (!previous) return false;
  return isLessonCompleted(progress, course.id, previous.lesson.id);
}

export function courseStats(course: Course, progress: ProgressState): CourseStats {
  const flat = flattenLessons(course);
  const completed = flat.filter((entry) =>
    isLessonCompleted(progress, course.id, entry.lesson.id),
  ).length;
  const next = flat.find((entry) => !isLessonCompleted(progress, course.id, entry.lesson.id));
  return {
    total: flat.length,
    completed,
    nextLessonId: next?.lesson.id ?? null,
    allComplete: completed === flat.length,
  };
}

export function lessonStatus(
  course: Course,
  lessonId: string,
  progress: ProgressState,
  stats: CourseStats = courseStats(course, progress),
): LessonStatus {
  if (isLessonCompleted(progress, course.id, lessonId)) return 'completed';
  if (stats.nextLessonId === lessonId) return 'current';
  return 'locked';
}
