import { gradeExercise } from '@speeko/core';
import {
  canSubmit,
  choiceOptions,
  deterministicShuffle,
  earnedExerciseXp,
  expectedChoice,
  initialDraft,
  isSupportedExercise,
  matchPairOrder,
  SUPPORTED_EXERCISE_KINDS,
  toAnswerInput,
  getTokenPool,
} from '../lib/exercise';

const choose = {
  id: 'choose-1',
  kind: 'chooseMeaning',
  prompt: 'Choose the meaning of नमस्ते',
  options: ['Hello', 'Thank you', 'Goodbye'],
  answerIndex: 0,
} as any;

const listen = {
  id: 'listen-1',
  kind: 'listenChoose',
  prompt: 'What did you hear?',
  audioUrl: '',
  options: ['पानी', 'दूध'],
  answerIndex: 1,
} as any;

const blank = {
  id: 'blank-1',
  kind: 'fillBlank',
  prompt: 'Fill the blank',
  sentence: 'मैं ___ हूँ।',
  options: ['ठीक', 'किताब'],
  answerIndex: 0,
} as any;

const type = {
  id: 'type-1',
  kind: 'typeTranslation',
  prompt: 'Type “hello” in Hindi',
  expected: ['नमस्ते'],
  acceptTypos: false,
} as any;

const pairs = {
  id: 'pairs-1',
  kind: 'matchPairs',
  prompt: 'Match the pairs',
  pairs: [
    ['एक', 'one'],
    ['दो', 'two'],
    ['तीन', 'three'],
  ],
} as any;

const wordBank = {
  id: 'bank-1',
  kind: 'wordBank',
  prompt: 'Build the sentence',
  words: ['मैं', 'हूँ'],
  answer: ['मैं', 'हूँ'],
} as any;

const arrangeSentence = {
  id: 'arrange-1',
  kind: 'arrangeSentence',
  prompt: 'Arrange the sentence',
  tiles: ['है', 'यह', 'किताब'],
  answer: ['यह', 'किताब', 'है'],
} as any;

const typeWhatYouHear = {
  id: 'type-what-you-hear-1',
  kind: 'typeWhatYouHear',
  prompt: 'Type what you hear',
  expected: ['नमस्ते'],
} as any;

const speak = {
  id: 'speak-1',
  kind: 'speak',
  prompt: 'Say it out loud',
  expected: ['नमस्ते'],
  softScore: true,
} as any;

const speakStrict = {
  id: 'speak-2',
  kind: 'speak',
  prompt: 'Say it precisely',
  expected: ['नमस्ते'],
  softScore: false,
} as any;

const unsupported = {
  id: 'image-1',
  kind: 'chooseImage',
  prompt: 'Which one is it?',
  options: ['hello-image.png', 'goodbye-image.png'],
  answerIndex: 0,
} as any;

describe('mobile exercise drafts', () => {
  it('treats fillBlank and listenChoose as choice exercises', () => {
    expect(choiceOptions(blank)).toEqual(blank.options);
    expect(choiceOptions(listen)).toEqual(listen.options);
    expect(initialDraft(blank)).toEqual({ kind: 'choice', index: null });
    expect(initialDraft(listen)).toEqual({ kind: 'choice', index: null });
  });

  it('starts typed exercises empty and pair boards at zero', () => {
    expect(initialDraft(type)).toEqual({ kind: 'text', value: '' });
    expect(initialDraft(pairs)).toEqual({ kind: 'pairs', mismatches: 0, matched: 0 });
  });

  it('starts the newly supported kinds from an empty draft', () => {
    expect(initialDraft(wordBank)).toEqual({ kind: 'tokens', value: [] });
    expect(initialDraft(arrangeSentence)).toEqual({ kind: 'tokens', value: [] });
    expect(initialDraft(typeWhatYouHear)).toEqual({ kind: 'text', value: '' });
    expect(initialDraft(speak)).toEqual({ kind: 'speak', transcript: '', selfReported: false });
  });

  it('advertises exactly the nine published exercise kinds', () => {
    expect([...SUPPORTED_EXERCISE_KINDS].sort()).toEqual(
      [
        'chooseMeaning',
        'listenChoose',
        'fillBlank',
        'typeTranslation',
        'matchPairs',
        'wordBank',
        'arrangeSentence',
        'typeWhatYouHear',
        'speak',
      ].sort(),
    );
    expect(SUPPORTED_EXERCISE_KINDS).toHaveLength(9);
    expect(isSupportedExercise(choose)).toBe(true);
    expect(isSupportedExercise(listen)).toBe(true);
    expect(isSupportedExercise(blank)).toBe(true);
    expect(isSupportedExercise(type)).toBe(true);
    expect(isSupportedExercise(pairs)).toBe(true);
    expect(isSupportedExercise(wordBank)).toBe(true);
    expect(isSupportedExercise(arrangeSentence)).toBe(true);
    expect(isSupportedExercise(typeWhatYouHear)).toBe(true);
    expect(isSupportedExercise(speak)).toBe(true);
    expect(isSupportedExercise(unsupported)).toBe(false);
  });
});

describe('mobile exercise submission rules', () => {
  it('requires a selection, real text, or every pair', () => {
    expect(canSubmit(choose, { kind: 'choice', index: null })).toBe(false);
    expect(canSubmit(choose, { kind: 'choice', index: 1 })).toBe(true);
    expect(canSubmit(type, { kind: 'text', value: '   ' })).toBe(false);
    expect(canSubmit(type, { kind: 'text', value: 'नमस्ते' })).toBe(true);
    expect(canSubmit(pairs, { kind: 'pairs', mismatches: 0, matched: 2 })).toBe(false);
    expect(canSubmit(pairs, { kind: 'pairs', mismatches: 1, matched: 3 })).toBe(true);
  });

  it('requires at least one token before a token board can submit', () => {
    expect(canSubmit(wordBank, { kind: 'tokens', value: [] })).toBe(false);
    expect(canSubmit(wordBank, { kind: 'tokens', value: [0] })).toBe(true);
    expect(canSubmit(arrangeSentence, { kind: 'tokens', value: [] })).toBe(false);
    expect(canSubmit(arrangeSentence, { kind: 'tokens', value: [2] })).toBe(true);
  });

  it('requires a transcript or a self-report before speaking can submit', () => {
    expect(canSubmit(speak, { kind: 'speak', transcript: '', selfReported: false })).toBe(false);
    expect(canSubmit(speak, { kind: 'speak', transcript: '   ', selfReported: false })).toBe(false);
    expect(canSubmit(speak, { kind: 'speak', transcript: 'नमस्ते', selfReported: false })).toBe(true);
    expect(canSubmit(speak, { kind: 'speak', transcript: '', selfReported: true })).toBe(true);
  });

  it('never lets an unsupported kind submit', () => {
    expect(canSubmit(unsupported, { kind: 'text', value: 'मैं हूँ' })).toBe(false);
    expect(toAnswerInput(unsupported, { kind: 'text', value: 'मैं हूँ' })).toBeNull();
  });

  it('maps fillBlank and listenChoose to choice answers, never text', () => {
    expect(toAnswerInput(blank, { kind: 'choice', index: 0 })).toEqual({
      kind: 'choice',
      index: 0,
    });
    expect(toAnswerInput(listen, { kind: 'choice', index: 1 })).toEqual({
      kind: 'choice',
      index: 1,
    });
  });

  it('maps typed answers and pair results', () => {
    expect(toAnswerInput(type, { kind: 'text', value: 'नमस्ते' })).toEqual({
      kind: 'text',
      value: 'नमस्ते',
    });
    expect(toAnswerInput(typeWhatYouHear, { kind: 'text', value: 'नमस्ते' })).toEqual({
      kind: 'text',
      value: 'नमस्ते',
    });
    expect(
      toAnswerInput(pairs, { kind: 'pairs', mismatches: 2, matched: 3 }),
    ).toEqual({ kind: 'pairs', mismatches: 2 });
  });

  it('maps token drafts to token answers in tap order', () => {
    expect(toAnswerInput(wordBank, { kind: 'tokens', value: [1, 0] })).toEqual({
      kind: 'tokens',
      value: ['हूँ', 'मैं'],
    });
    expect(toAnswerInput(wordBank, { kind: 'tokens', value: [0, 1] })).toEqual({
      kind: 'tokens',
      value: ['मैं', 'हूँ'],
    });
    expect(toAnswerInput(arrangeSentence, { kind: 'tokens', value: [1, 2, 0] })).toEqual({
      kind: 'tokens',
      value: ['यह', 'किताब', 'है'],
    });
    expect(toAnswerInput(wordBank, { kind: 'tokens', value: [] })).toBeNull();
    expect(toAnswerInput(type, { kind: 'tokens', value: [0] })).toBeNull();
  });

  it('produces a tokens input the grader joins back into the answer', () => {
    const input = toAnswerInput(wordBank, { kind: 'tokens', value: [0, 1] });
    expect(input).toEqual({ kind: 'tokens', value: ['मैं', 'हूँ'] });
    expect(input && gradeExercise(wordBank, input).correct).toBe(true);
    expect(gradeExercise(wordBank, { kind: 'tokens', value: ['हूँ', 'मैं'] }).correct).toBe(false);

    const tiles = toAnswerInput(arrangeSentence, { kind: 'tokens', value: [1, 2, 0] });
    expect(tiles && gradeExercise(arrangeSentence, tiles).correct).toBe(true);
  });

  it('maps speak drafts to speak answers', () => {
    expect(
      toAnswerInput(speak, { kind: 'speak', transcript: 'नमस्ते', selfReported: true }),
    ).toEqual({ kind: 'speak', transcript: 'नमस्ते', selfReported: true });
    expect(
      toAnswerInput(speak, { kind: 'speak', transcript: '', selfReported: false }),
    ).toBeNull();
  });

  it('soft-scores self-reported speaking only when softScore allows it', () => {
    expect(
      gradeExercise(speak, { kind: 'speak', transcript: '', selfReported: true }).correct,
    ).toBe(true);
    expect(
      gradeExercise(speakStrict, { kind: 'speak', transcript: '', selfReported: true }).correct,
    ).toBe(false);
    expect(
      gradeExercise(speakStrict, { kind: 'speak', transcript: 'नमस्ते', selfReported: false })
        .correct,
    ).toBe(true);
  });

  it('reports the expected choice text on reveal', () => {
    expect(expectedChoice(choose)).toBe('Hello');
    expect(expectedChoice(blank)).toBe('ठीक');
    expect(expectedChoice(listen)).toBe('दूध');
    expect(expectedChoice(type)).toBeNull();
  });

  it('produces a deterministic right-column order', () => {
    const first = matchPairOrder(pairs.pairs, pairs.id);
    const second = matchPairOrder(pairs.pairs, pairs.id);
    expect(second).toEqual(first);
    expect([...first].sort()).toEqual([0, 1, 2]);
  });

  it('shuffles token pools deterministically without losing tokens', () => {
    const first = deterministicShuffle(wordBank.words, wordBank.id);
    expect(deterministicShuffle(wordBank.words, wordBank.id)).toEqual(first);
    expect([...first].sort()).toEqual([...wordBank.words].sort());
    expect(first).toHaveLength(wordBank.words.length);

    const tiles = deterministicShuffle(arrangeSentence.tiles, arrangeSentence.id);
    expect(deterministicShuffle(arrangeSentence.tiles, arrangeSentence.id)).toEqual(tiles);
    expect([...tiles].sort()).toEqual([...arrangeSentence.tiles].sort());
  });

  it('reads the token pool for each token kind', () => {
    expect(getTokenPool(wordBank)).toBe(wordBank.words);
    expect(getTokenPool(arrangeSentence)).toBe(arrangeSentence.tiles);
    expect(getTokenPool(type)).toBeNull();
    expect(getTokenPool(speak)).toBeNull();
  });

  it('awards exercise XP only for correct answers, matching the web session', () => {
    const exercises = [choose, blank, type, pairs];
    expect(
      earnedExerciseXp(exercises, [
        { exerciseId: choose.id, correct: true },
        { exerciseId: blank.id, correct: false },
        { exerciseId: type.id, correct: true },
        { exerciseId: pairs.id, correct: true },
      ]),
    ).toBe(2 + 4 + 3);
    expect(earnedExerciseXp(exercises, [])).toBe(0);
  });
});
