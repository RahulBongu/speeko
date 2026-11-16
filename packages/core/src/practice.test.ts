import { describe, expect, it } from 'vitest';
import type { Course } from './content.js';
import {
  buildDuePracticePlan,
  buildSkillExerciseIndex,
  buildTroublePracticePlan,
  buildUnitPracticePlan,
  practiceOverview,
} from './practice.js';
import { emptyProgress, lessonKey, type ProgressState } from './progress.js';
import { validateCourse } from './content.js';

const NOW = Date.UTC(2026, 10, 15, 12, 0);
const DAY = 86_400_000;

function makeCourse(): Course {
  return validateCourse({
    id: 'hi-test',
    locale: 'hi',
    title: 'Hindi Test',
    difficulty: 'A1',
    units: [
      {
        id: 'u1',
        title: 'Basics',
        order: 0,
        lessons: [
          {
            id: 'u1-l1',
            title: 'Greetings',
            order: 0,
            difficulty: 'A1',
            exercises: [
              {
                id: 'u1-l1-e1',
                kind: 'chooseMeaning',
                prompt: 'Hello',
                options: ['नमस्ते', 'अलविदा'],
                answerIndex: 0,
              },
              {
                id: 'u1-l1-e2',
                kind: 'typeTranslation',
                prompt: 'Type thank you',
                expected: ['धन्यवाद'],
              },
            ],
          },
          {
            id: 'u1-l2',
            title: 'Courtesy',
            order: 1,
            difficulty: 'A1',
            exercises: [
              {
                id: 'u1-l2-e1',
                kind: 'chooseMeaning',
                prompt: 'Please',
                options: ['कृपया', 'नमस्ते'],
                answerIndex: 0,
              },
              {
                id: 'u1-l2-e2',
                kind: 'chooseMeaning',
                prompt: 'Thank you',
                options: ['धन्यवाद', 'नमस्ते'],
                answerIndex: 0,
              },
            ],
          },
        ],
      },
      {
        id: 'u2',
        title: 'Food',
        order: 1,
        lessons: [
          {
            id: 'u2-l1',
            title: 'Water',
            order: 0,
            difficulty: 'A1',
            exercises: [
              {
                id: 'u2-l1-e1',
                kind: 'chooseMeaning',
                prompt: 'Water',
                options: ['पानी', 'चाय'],
                answerIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  });
}

function completed(progress: ProgressState, courseId: string, lessonId: string): ProgressState {
  return {
    ...progress,
    completed: {
      ...progress.completed,
      [lessonKey(courseId, lessonId)]: {
        courseId,
        lessonId,
        completedAt: new Date(NOW).toISOString(),
        accuracy: 1,
        xp: 10,
      },
    },
  };
}

function makeProgress(): ProgressState {
  const base = completed(emptyProgress(new Date(NOW)), 'hi-test', 'u1-l1');
  return {
    ...base,
    srs: {
      'hi:नमस्ते': { skillId: 'hi:नमस्ते', box: 1, dueAt: NOW - 1000, lapses: 0 },
      'hi:धन्यवाद': { skillId: 'hi:धन्यवाद', box: 2, dueAt: NOW + DAY, lapses: 1 },
      'hi:कृपया': { skillId: 'hi:कृपया', box: 1, dueAt: NOW - 500, lapses: 0 },
      'hi:पानी': { skillId: 'hi:पानी', box: 1, dueAt: NOW - 100, lapses: 0 },
      'hi:unknown': { skillId: 'hi:unknown', box: 3, dueAt: NOW, lapses: 2 },
    },
  };
}

describe('practice planning', () => {
  it('indexes only completed lessons and keeps one exercise per skill', () => {
    const course = makeCourse();
    const index = buildSkillExerciseIndex(course, makeProgress());
    expect([...index.keys()].sort()).toEqual(['hi:धन्यवाद', 'hi:नमस्ते'].sort());
    expect(index.get('hi:धन्यवाद')?.id).toBe('u1-l1-e2');
  });

  it('builds a due plan from learned skills only', () => {
    const plan = buildDuePracticePlan(makeCourse(), makeProgress(), NOW);
    expect(plan.matched).toBe(1);
    expect(plan.exercises.map((exercise) => exercise.id)).toEqual(['u1-l1-e1']);
    expect(buildDuePracticePlan(makeCourse(), makeProgress(), NOW, 0)).toEqual({
      exercises: [],
      matched: 1,
    });
  });

  it('builds a trouble plan from lapsed learned cards', () => {
    const plan = buildTroublePracticePlan(makeCourse(), makeProgress());
    expect(plan.matched).toBe(1);
    expect(plan.exercises.map((exercise) => exercise.id)).toEqual(['u1-l1-e2']);
  });

  it('practices a unit from completed lessons, round-robin', () => {
    const course = makeCourse();
    const progress = completed(makeProgress(), 'hi-test', 'u1-l2');
    const plan = buildUnitPracticePlan(course, progress, 1, 3);
    expect(plan.matched).toBe(4);
    expect(plan.exercises.map((exercise) => exercise.id)).toEqual([
      'u1-l1-e1',
      'u1-l2-e1',
      'u1-l1-e2',
    ]);
    expect(buildUnitPracticePlan(course, progress, 2).exercises).toEqual([]);
    expect(buildUnitPracticePlan(course, progress, 99).matched).toBe(0);
  });

  it('summarises only skills the learner has actually met', () => {
    const overview = practiceOverview(makeCourse(), makeProgress(), NOW);
    expect(overview.dueCount).toBe(1);
    expect(overview.troubleCount).toBe(1);
    expect(overview.masteredCount).toBe(0);
    expect(overview.learnedCount).toBe(2);
    expect(overview.nextDueAt).toBe(NOW + DAY);
    expect(overview.boxCounts).toEqual([0, 1, 1, 0, 0, 0]);
    expect(overview.hasPractice).toBe(true);
    expect(overview.units[0]).toMatchObject({
      index: 1,
      completedLessons: 1,
      lessons: 2,
      started: true,
      learnedExercises: 2,
    });
    expect(overview.units[1]).toMatchObject({
      index: 2,
      completedLessons: 0,
      started: false,
      learnedExercises: 0,
    });
  });

  it('reports an empty hub for a fresh learner', () => {
    const overview = practiceOverview(makeCourse(), emptyProgress(new Date(NOW)), NOW);
    expect(overview).toMatchObject({
      dueCount: 0,
      troubleCount: 0,
      masteredCount: 0,
      learnedCount: 0,
      nextDueAt: null,
      hasPractice: false,
    });
    expect(overview.units.every((unit) => !unit.started)).toBe(true);
  });
});
