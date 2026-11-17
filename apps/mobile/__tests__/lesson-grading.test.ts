import { gradeExercise } from '@speeko/core';

describe('mobile lesson grading contract', () => {
  it('grades a correct choice answer', () => {
    const exercise = {
      id: 'e1',
      kind: 'chooseMeaning',
      prompt: 'Hello',
      options: ['नमस्ते', 'धन्यवाद'],
      answerIndex: 0,
    } as any;
    expect(gradeExercise(exercise, { kind: 'choice', index: 0 })).toEqual({ correct: true, expected: 'नमस्ते' });
  });

  it('grades an incorrect choice answer', () => {
    const exercise = {
      id: 'e1',
      kind: 'chooseMeaning',
      prompt: 'Hello',
      options: ['नमस्ते', 'धन्यवाद'],
      answerIndex: 0,
    } as any;
    expect(gradeExercise(exercise, { kind: 'choice', index: 1 })).toEqual({ correct: false, expected: 'नमस्ते' });
  });

  it('does not count malformed input as correct', () => {
    const exercise = {
      id: 'e1',
      kind: 'typeTranslation',
      prompt: 'Type hello',
      expected: ['नमस्ते'],
    } as any;
    expect(gradeExercise(exercise, { kind: 'choice', index: 0 })).toEqual({ correct: false, expected: 'नमस्ते' });
  });
});