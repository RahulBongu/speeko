import { describe, expect, it } from 'vitest';
import {
  normalizeSkillText,
  qualityForOutcome,
  skillIdFor,
  targetTextFor,
} from './skills.js';
import type { Exercise } from './content.js';

const choose: Exercise = {
  id: 'e1',
  kind: 'chooseMeaning',
  prompt: 'Hello',
  options: ['नमस्ते', 'धन्यवाद'],
  answerIndex: 0,
};

const typing: Exercise = {
  id: 'e2',
  kind: 'typeTranslation',
  prompt: 'Type hello',
  expected: ['नमस्ते'],
  acceptTypos: true,
};

const wordBank: Exercise = {
  id: 'e3',
  kind: 'wordBank',
  prompt: 'Build the sentence',
  words: ['नमस्ते', 'है', 'ka', 'hai'],
  answer: ['नमस्ते', 'है'],
};

const matching: Exercise = {
  id: 'e4',
  kind: 'matchPairs',
  prompt: 'Match the pairs',
  pairs: [
    ['Yes', 'हाँ'],
    ['No', 'नहीं'],
  ],
};

describe('normalizeSkillText', () => {
  it('trims, lowercases, and collapses whitespace', () => {
    expect(normalizeSkillText('  Hello   World ')).toBe('hello world');
  });

  it('normalizes unicode to NFKC', () => {
    expect(normalizeSkillText('café')).toBe('café');
  });
});

describe('targetTextFor', () => {
  it('reads the correct option for choose-meaning exercises', () => {
    expect(targetTextFor(choose)).toBe('नमस्ते');
  });

  it('reads the expected text for typing exercises', () => {
    expect(targetTextFor(typing)).toBe('नमस्ते');
  });

  it('joins answer tokens for word-bank exercises', () => {
    expect(targetTextFor(wordBank)).toBe('नमस्ते है');
  });

  it('joins target column for match-pairs exercises', () => {
    expect(targetTextFor(matching)).toBe('हाँ|नहीं');
  });
});

describe('skillIdFor', () => {
  it('prefixes the skill with the course locale', () => {
    expect(skillIdFor('hi', choose)).toBe('hi:नमस्ते');
  });

  it('maps different exercise kinds for the same word to the same skill', () => {
    expect(skillIdFor('hi', typing)).toBe(skillIdFor('hi', choose));
  });
});

describe('qualityForOutcome', () => {
  it('scores a first-try correct answer as perfect recall', () => {
    expect(qualityForOutcome(true, false)).toBe(5);
  });

  it('scores a recovered correct answer as good', () => {
    expect(qualityForOutcome(true, true)).toBe(4);
  });

  it('scores a wrong answer as a grade 2', () => {
    expect(qualityForOutcome(false, false)).toBe(2);
  });
});
