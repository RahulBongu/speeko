import {
  browserTimeZone,
  emptyProgress,
  lessonKey,
  migrateProgress,
  type Course,
} from '@speeko/core';
import type { ProgressState } from '@speeko/core';
import { flattenLessons } from './courses';

export {
  DAILY_GOAL,
  DAILY_GOAL_OPTIONS,
  applyReviews,
  browserTimeZone,
  buildHabitReport,
  dayKeyInTimeZone,
  dueReviewCards,
  emptyProgress,
  historyFromActivity,
  lessonKey,
  recordCompletion,
  recordCompletionAndReviews,
  todayKey,
} from '@speeko/core';
export type { HabitReport, LessonRecord, ProgressState } from '@speeko/core';

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
  const timeZone = browserTimeZone();
  if (typeof window === 'undefined') {
    const empty = emptyProgress(now);
    return { ...empty, timeZone };
  }
  try {
    const raw =
      window.localStorage.getItem(PROGRESS_KEY) ??
      window.localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (!raw) return { ...emptyProgress(now), timeZone };
    return migrateProgress(JSON.parse(raw), now, timeZone);
  } catch {
    return { ...emptyProgress(now), timeZone };
  }
}

export function saveProgress(progress: ProgressState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent<ProgressState>(PROGRESS_EVENT, { detail: progress }));
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
