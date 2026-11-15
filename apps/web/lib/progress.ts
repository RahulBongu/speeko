import { updateStreak, type Course } from '@speeko/core';
import { flattenLessons } from './courses';

export const PROGRESS_KEY = 'speeko.progress.v1';
export const PROGRESS_EVENT = 'speeko:progress';
export const DAILY_GOAL = 50;

export interface LessonRecord {
  courseId: string;
  lessonId: string;
  completedAt: string;
  accuracy: number;
  xp: number;
}

export interface ProgressState {
  version: 1;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  todayDate: string;
  todayXp: number;
  completed: Record<string, LessonRecord>;
  lastCourseId: string | null;
  lastLessonId: string | null;
}

export interface CompletionInput {
  courseId: string;
  lessonId: string;
  xp: number;
  accuracy: number;
}

export type LessonStatus = 'completed' | 'current' | 'locked';

export interface CourseStats {
  total: number;
  completed: number;
  nextLessonId: string | null;
  allComplete: boolean;
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function lessonKey(courseId: string, lessonId: string): string {
  return `${courseId}:${lessonId}`;
}

export function emptyProgress(now = new Date()): ProgressState {
  return {
    version: 1,
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    todayDate: todayKey(now),
    todayXp: 0,
    completed: {},
    lastCourseId: null,
    lastLessonId: null,
  };
}

export function loadProgress(now = new Date()): ProgressState {
  if (typeof window === 'undefined') return emptyProgress(now);
  const today = todayKey(now);
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress(now);
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      version: 1,
      xp: typeof parsed.xp === 'number' && parsed.xp >= 0 ? parsed.xp : 0,
      streak: typeof parsed.streak === 'number' && parsed.streak >= 0 ? parsed.streak : 0,
      lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : null,
      todayDate: today,
      todayXp:
        parsed.todayDate === today && typeof parsed.todayXp === 'number' && parsed.todayXp >= 0
          ? parsed.todayXp
          : 0,
      completed:
        parsed.completed && typeof parsed.completed === 'object'
          ? (parsed.completed as Record<string, LessonRecord>)
          : {},
      lastCourseId: typeof parsed.lastCourseId === 'string' ? parsed.lastCourseId : null,
      lastLessonId: typeof parsed.lastLessonId === 'string' ? parsed.lastLessonId : null,
    };
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
