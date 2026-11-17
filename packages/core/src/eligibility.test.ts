import { describe, expect, it } from 'vitest';
import { eligibleExercises, isExerciseEligible } from './eligibility.js';
import type { Exercise, Lesson } from './content.js';

const audio = { url: 'https://example.com/audio/greetings.mp3' };

const choose = {
  id: 'e1',
  kind: 'chooseMeaning',
  prompt: 'Hello',
  options: ['नमस्ते', 'धन्यवाद'],
  answerIndex: 0,
} as unknown as Exercise;

const silent = {
  id: 'e2',
  kind: 'listenChoose',
  prompt: 'Listen and choose',
  audioUrl: '',
  options: ['सुप्रभात', 'नमस्ते'],
  answerIndex: 0,
} as unknown as Exercise;

const spoken = {
  id: 'e3',
  kind: 'listenChoose',
  prompt: 'Listen and choose',
  audioUrl: audio.url,
  options: ['सुप्रभात', 'नमस्ते'],
  answerIndex: 0,
} as unknown as Exercise;

const pairs = {
  id: 'e4',
  kind: 'matchPairs',
  prompt: 'Match',
  pairs: [
    ['Yes', 'हाँ'],
    ['No', 'नहीं'],
  ],
} as unknown as Exercise;

const lesson = (exercises: Exercise[]): Lesson =>
  ({
    id: 'l1',
    title: 'Lesson',
    order: 0,
    difficulty: 'A1',
    reviewStatus: 'draft',
    exercises,
  }) as Lesson;

describe('isExerciseEligible', () => {
  it('excludes listenChoose with an empty audioUrl, keeps everything else', () => {
    expect(isExerciseEligible(silent)).toBe(false);
    expect(isExerciseEligible(spoken)).toBe(true);
    expect(isExerciseEligible(choose)).toBe(true);
    expect(isExerciseEligible(pairs)).toBe(true);
  });
});

describe('eligibleExercises', () => {
  it('filters ineligible listening items but preserves order and identity', () => {
    const result = eligibleExercises([choose, silent, pairs, spoken]);
    expect(result.map((exercise) => exercise.id)).toEqual(['e1', 'e4', 'e3']);
    expect(result).toEqual([choose, pairs, spoken]);
  });

  it('returns an empty list when the only listening item is excluded', () => {
    expect(eligibleExercises([silent])).toEqual([]);
  });

  it('leaves a fully eligible lesson unchanged', () => {
    expect(eligibleExercises([choose, pairs])).toHaveLength(2);
  });
});
