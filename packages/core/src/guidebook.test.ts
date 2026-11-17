import { describe, expect, it } from 'vitest';
import {
  guidebookItems,
  guidebookTargets,
} from './guidebook.js';
import type { Exercise } from './content.js';

const choose = {
  id: 'e1',
  kind: 'chooseMeaning',
  prompt: 'Choose the meaning',
  options: ['नमस्ते', 'धन्यवाद'],
  answerIndex: 0,
} as Exercise;

const failingChoose = {
  id: 'e1b',
  kind: 'chooseMeaning',
  prompt: 'Nobody knows',
  options: [],
  answerIndex: 0,
} as Exercise;

const typing = {
  id: 'e2',
  kind: 'typeTranslation',
  prompt: 'Type hello',
  expected: ['नमस्ते'],
  acceptTypos: false,
} as Exercise;

const pairs = {
  id: 'e3',
  kind: 'matchPairs',
  prompt: 'Match',
  pairs: [
    ['Yes', 'हाँ'],
    ['No', 'नहीं'],
  ],
} as Exercise;

const sentence = {
  id: 'e4',
  kind: 'arrangeSentence',
  prompt: 'Arrange it',
  tiles: ['मैं', 'हूँ'],
  answer: ['मैं', 'हूँ'],
} as Exercise;

describe('guidebookTargets', () => {
  it('returns the answer option for choice boards', () => {
    expect(guidebookTargets(choose)).toEqual(['नमस्ते']);
  });

  it('returns every member of a pair board individually', () => {
    expect(guidebookTargets(pairs)).toEqual(['हाँ', 'नहीं']);
  });

  it('joins ordered sentence boards into one preview string', () => {
    expect(guidebookTargets(sentence)).toEqual(['मैं हूँ']);
  });

  it('returns nothing when the answer key is missing', () => {
    expect(guidebookTargets(failingChoose)).toEqual([]);
  });
});

describe('guidebookItems', () => {
  it('dedupes identical targets and keeps first-seen order and provenance', () => {
    const items = guidebookItems([choose, pairs, typing, choose]);
    expect(items.map((item) => item.target)).toEqual(['नमस्ते', 'हाँ', 'नहीं']);
    expect(items[0]).toEqual({ target: 'नमस्ते', prompt: 'Choose the meaning', kind: 'chooseMeaning' });
  });

  it('skips exercises with no extractable target', () => {
    expect(guidebookItems([failingChoose])).toEqual([]);
  });
});
