import {
  canSubmit,
  choiceOptions,
  earnedExerciseXp,
  expectedChoice,
  initialDraft,
  isSupportedExercise,
  matchPairOrder,
  SUPPORTED_EXERCISE_KINDS,
  toAnswerInput,
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

const unsupported = {
  id: 'bank-1',
  kind: 'wordBank',
  prompt: 'Build the sentence',
  words: ['मैं', 'हूँ'],
  expected: ['मैं हूँ'],
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

  it('advertises exactly the five published exercise kinds', () => {
    expect([...SUPPORTED_EXERCISE_KINDS].sort()).toEqual(
      ['chooseMeaning', 'fillBlank', 'listenChoose', 'matchPairs', 'typeTranslation'].sort(),
    );
    expect(isSupportedExercise(choose)).toBe(true);
    expect(isSupportedExercise(listen)).toBe(true);
    expect(isSupportedExercise(blank)).toBe(true);
    expect(isSupportedExercise(type)).toBe(true);
    expect(isSupportedExercise(pairs)).toBe(true);
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
    expect(
      toAnswerInput(pairs, { kind: 'pairs', mismatches: 2, matched: 3 }),
    ).toEqual({ kind: 'pairs', mismatches: 2 });
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
