import { describe, it, expect } from 'vitest';
import {
  gradeExercise,
  normalizeAnswer,
  levenshtein,
  type AnswerInput,
  type Exercise,
} from './index.js';

const choice: Exercise = {
  id: 'c1',
  kind: 'chooseMeaning',
  prompt: 'Hello',
  options: ['नमस्ते', 'नहीं'],
  answerIndex: 0,
};

const typeTranslation: Exercise = {
  id: 't1',
  kind: 'typeTranslation',
  prompt: 'Type "hello"',
  expected: ['hello'],
  acceptTypos: true,
};

const typeWhatYouHear: Exercise = {
  id: 't2',
  kind: 'typeWhatYouHear',
  prompt: 'Type what you hear',
  expected: ['नमस्ते'],
};

const wordBank: Exercise = {
  id: 'w1',
  kind: 'wordBank',
  prompt: 'Build the sentence',
  words: ['I', 'have', 'an', 'apple'],
  answer: ['I', 'have', 'an', 'apple'],
};

const pairs: Exercise = {
  id: 'p1',
  kind: 'matchPairs',
  prompt: 'Match the pairs',
  pairs: [
    ['Yes', 'हाँ'],
    ['No', 'नहीं'],
  ],
};

const speak: Exercise = {
  id: 's1',
  kind: 'speak',
  prompt: 'Say hello',
  expected: ['नमस्ते'],
  softScore: true,
};

const speakStrict: Exercise = {
  id: 's2',
  kind: 'speak',
  prompt: 'Say hello',
  expected: ['नमस्ते'],
  softScore: false,
};

describe('normalizeAnswer', () => {
  it('trims, collapses spaces, strips trailing punctuation and case', () => {
    expect(normalizeAnswer('  Hello   World!  ')).toBe('hello world');
    expect(normalizeAnswer('नमस्ते।')).toBe('नमस्ते');
  });

  it('keeps Indic diacritics intact', () => {
    expect(normalizeAnswer('क़िला')).toBe('क़िला');
    expect(normalizeAnswer('हिन्दी')).toBe('हिन्दी');
  });
});

describe('levenshtein', () => {
  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('hello', 'hello')).toBe(0);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});

describe('gradeExercise', () => {
  it('grades choice questions and reports the expected answer', () => {
    expect(gradeExercise(choice, { kind: 'choice', index: 0 })).toEqual({
      correct: true,
      expected: 'नमस्ते',
    });
    expect(gradeExercise(choice, { kind: 'choice', index: 1 })).toEqual({
      correct: false,
      expected: 'नमस्ते',
    });
  });

  it('accepts a one-character typo when allowed', () => {
    expect(gradeExercise(typeTranslation, { kind: 'text', value: 'helo' }).correct).toBe(true);
    expect(gradeExercise(typeTranslation, { kind: 'text', value: 'helloo' }).correct).toBe(true);
    expect(gradeExercise(typeTranslation, { kind: 'text', value: 'goodbye' }).correct).toBe(false);
  });

  it('does not tolerate typos for type-what-you-hear', () => {
    expect(gradeExercise(typeWhatYouHear, { kind: 'text', value: 'नमस्ते' }).correct).toBe(true);
    expect(gradeExercise(typeWhatYouHear, { kind: 'text', value: 'नमसते' }).correct).toBe(false);
  });

  it('checks token order for word banks', () => {
    expect(gradeExercise(wordBank, { kind: 'tokens', value: ['I', 'have', 'an', 'apple'] }).correct).toBe(true);
    expect(gradeExercise(wordBank, { kind: 'tokens', value: ['apple', 'have', 'an', 'I'] }).correct).toBe(false);
  });

  it('grades match-pairs by mismatch count', () => {
    expect(gradeExercise(pairs, { kind: 'pairs', mismatches: 0 }).correct).toBe(true);
    expect(gradeExercise(pairs, { kind: 'pairs', mismatches: 2 }).correct).toBe(false);
  });

  it('soft-scores speaking exercises', () => {
    const selfReported: AnswerInput = { kind: 'speak', transcript: '', selfReported: true };
    expect(gradeExercise(speak, selfReported).correct).toBe(true);
    expect(gradeExercise(speakStrict, selfReported).correct).toBe(false);
    expect(
      gradeExercise(speakStrict, { kind: 'speak', transcript: 'नमस्ते', selfReported: false }).correct,
    ).toBe(true);
  });

  it('accepts the canonical answer for every supported exercise kind', () => {
    const fillBlank: Exercise = {
      id: 'f1',
      kind: 'fillBlank',
      prompt: 'Fill in the blank',
      sentence: 'I have ___ apples.',
      options: ['one', 'two', 'three'],
      answerIndex: 1,
    };
    const listenChoose: Exercise = {
      id: 'l1',
      kind: 'listenChoose',
      prompt: 'Listen',
      options: ['नमस्ते', 'नहीं'],
      answerIndex: 0,
    };
    const arrange: Exercise = {
      id: 'a1',
      kind: 'arrangeSentence',
      prompt: 'Arrange',
      tiles: ['good', 'morning'],
      answer: ['good', 'morning'],
    };
    const chooseImage: Exercise = {
      id: 'i1',
      kind: 'chooseImage',
      prompt: 'Pick',
      options: ['a', 'b'],
      answerIndex: 1,
    };

    expect(gradeExercise(fillBlank, { kind: 'choice', index: 1 }).correct).toBe(true);
    expect(gradeExercise(listenChoose, { kind: 'choice', index: 0 }).correct).toBe(true);
    expect(gradeExercise(arrange, { kind: 'tokens', value: ['good', 'morning'] }).correct).toBe(true);
    expect(gradeExercise(chooseImage, { kind: 'choice', index: 1 }).correct).toBe(true);
  });
});
