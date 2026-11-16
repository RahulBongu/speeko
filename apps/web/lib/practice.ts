import type { Course, ProgressState } from '@speeko/core';
import { buildUnitPracticePlan, lessonKey } from '@speeko/core';

/**
 * Synthetic lesson ids that are practice-only: no XP, no completion record,
 * no server reward. They still update the learner's SRS schedule.
 */
export function isPracticeLessonId(lessonId: string): boolean {
  return lessonId === 'review' || lessonId.startsWith('checkpoint-') || lessonId.startsWith('practice-');
}

export type PracticeKind = 'review' | 'checkpoint' | 'unit' | 'trouble' | 'lesson';

export function practiceKind(lessonId: string): PracticeKind {
  if (lessonId === 'review') return 'review';
  if (lessonId.startsWith('checkpoint-')) return 'checkpoint';
  if (lessonId.startsWith('practice-unit-')) return 'unit';
  if (lessonId === 'practice-trouble') return 'trouble';
  return 'lesson';
}

export interface UnitPracticeCheck {
  ok: boolean;
  exercises: number;
  reason?: string;
}

/** Validates a unit-practice id against the course and the learner's progress. */
export function checkUnitPractice(
  course: Course,
  progress: ProgressState,
  lessonId: string,
  limit = 10,
): UnitPracticeCheck {
  const match = /^practice-unit-(\d+)$/.exec(lessonId);
  if (!match) return { ok: false, exercises: 0, reason: 'That practice session does not exist.' };
  const unitNumber = Number(match[1]);
  const unit = course.units[unitNumber - 1];
  if (!Number.isInteger(unitNumber) || unitNumber < 1 || !unit) {
    return { ok: false, exercises: 0, reason: 'That unit does not exist in this course.' };
  }
  const completed = unit.lessons.filter(
    (lesson) => progress.completed[lessonKey(course.id, lesson.id)],
  ).length;
  if (completed === 0) {
    return {
      ok: false,
      exercises: 0,
      reason: `Finish a lesson in ${unit.title} before practicing it.`,
    };
  }
  const plan = buildUnitPracticePlan(course, progress, unitNumber, limit);
  if (plan.exercises.length === 0) {
    return { ok: false, exercises: 0, reason: 'This unit has no completed exercises yet.' };
  }
  return { ok: true, exercises: plan.exercises.length };
}
