import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gradeExercise, hasIndicScript, romanHint, validateCourse, type AnswerInput, type Course, type Exercise } from '@speeko/core';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(here, '../../../content');

function loadCourses(): Course[] {
  const courses: Course[] = [];
  for (const entry of readdirSync(contentDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name === 'dist') continue;
    for (const file of readdirSync(join(contentDir, entry.name))) {
      if (!file.endsWith('.json')) continue;
      const parsed = JSON.parse(readFileSync(join(contentDir, entry.name, file), 'utf8')) as unknown;
      courses.push(validateCourse(parsed));
    }
  }
  return courses;
}

function canonicalInput(exercise: Exercise): AnswerInput | null {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank':
    case 'chooseImage':
      return { kind: 'choice', index: exercise.answerIndex };
    case 'typeTranslation':
    case 'typeWhatYouHear':
      return { kind: 'text', value: exercise.expected[0] ?? '' };
    case 'wordBank':
    case 'arrangeSentence':
      return { kind: 'tokens', value: [...exercise.answer] };
    case 'matchPairs':
      return { kind: 'pairs', mismatches: 0 };
    case 'speak':
      return { kind: 'speak', transcript: exercise.expected[0] ?? '', selfReported: false };
    default:
      return null;
  }
}

describe('content grading integration', () => {
  const courses = loadCourses();

  it('loads all ten starter courses', () => {
    expect(courses.length).toBeGreaterThanOrEqual(10);
  });

  it('grades the canonical answer of every exercise as correct', () => {
    let checked = 0;
    for (const course of courses) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) {
            const input = canonicalInput(exercise);
            expect(input, `${course.id}/${exercise.id} has no canonical input`).not.toBeNull();
            const result = gradeExercise(exercise, input!);
            expect(result.correct, `${course.id}/${lesson.id}/${exercise.id} (${exercise.kind})`).toBe(true);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(150);
  });

  it('accepts a romanized answer for every typed target', () => {
    let checked = 0;
    for (const course of courses) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) {
            if (exercise.kind !== 'typeTranslation' && exercise.kind !== 'typeWhatYouHear') continue;
            const target = exercise.expected[0] ?? '';
            if (!hasIndicScript(target)) continue;
            const reading = romanHint(target);
            expect(reading, `${course.id}/${exercise.id} has no reading`).toBeTruthy();
            const result = gradeExercise(exercise, { kind: 'text', value: reading! });
            expect(result.correct, `${course.id}/${exercise.id} rejects "${reading}"`).toBe(true);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(25);
  });

  it('teaches the numbers one through ten in every starter course', () => {
    const starters = courses.filter((course) => course.id.endsWith('-starter'));
    expect(starters).toHaveLength(10);
    const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    for (const course of starters) {
      const prompts = new Set<string>();
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) {
            if (exercise.kind === 'chooseMeaning') prompts.add(exercise.prompt);
          }
        }
      }
      for (const number of numbers) {
        expect(prompts.has(number), `${course.id} is missing "${number}"`).toBe(true);
      }
    }
  });

  it('rejects a wrong option for every choice exercise', () => {
    for (const course of courses) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) {
            if (
              exercise.kind !== 'chooseMeaning' &&
              exercise.kind !== 'listenChoose' &&
              exercise.kind !== 'fillBlank' &&
              exercise.kind !== 'chooseImage'
            ) {
              continue;
            }
            const wrong = (exercise.answerIndex + 1) % exercise.options.length;
            expect(gradeExercise(exercise, { kind: 'choice', index: wrong }).correct).toBe(false);
          }
        }
      }
    }
  });
});
