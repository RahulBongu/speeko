import type { Exercise } from './content.js';
import { romanizedEqual } from './romanize.js';

// Answer input as captured by any client (web, mobile).
export type AnswerInput =
  | { kind: 'choice'; index: number }
  | { kind: 'text'; value: string }
  | { kind: 'tokens'; value: string[] }
  | { kind: 'pairs'; mismatches: number }
  | { kind: 'speak'; transcript: string; selfReported: boolean };

export interface GradeResult {
  correct: boolean;
  /** Canonical answer to show when the learner gets it wrong. */
  expected: string | null;
}

/**
 * Normalize a learner answer for comparison.
 *
 * - NFC keeps Indic conjuncts intact (never strip diacritics).
 * - Collapses whitespace and normalizes curly quotes.
 * - Drops trailing sentence punctuation (including danda/double danda).
 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?\u0964\u0965]+$/u, '')
    .toLowerCase();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current: number[] = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const insertion = (current[j - 1] ?? 0) + 1;
      const deletion = (previous[j] ?? 0) + 1;
      const substitution = (previous[j - 1] ?? 0) + cost;
      current[j] = Math.min(insertion, deletion, substitution);
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

function matchesExpected(value: string, expected: string[], allowTypos: boolean): boolean {
  const v = normalizeAnswer(value);
  for (const candidate of expected) {
    const e = normalizeAnswer(candidate);
    if (!e) continue;
    if (v === e) return true;
    // English-keyboard learners may type a romanized reading instead of the
    // target script. Both readings must match; this does not accept unrelated
    // words, only the same word written in Latin letters.
    if (romanizedEqual(value, candidate)) return true;
    // One-character typo tolerance only for reasonably long answers.
    if (allowTypos && Math.max(v.length, e.length) >= 4 && levenshtein(v, e) <= 1) return true;
  }
  return false;
}

function gradeChoice(
  exercise: { options: string[]; answerIndex: number },
  input: AnswerInput,
): GradeResult {
  const expected = exercise.options[exercise.answerIndex] ?? null;
  if (input.kind !== 'choice') return { correct: false, expected };
  return { correct: input.index === exercise.answerIndex, expected };
}

export function gradeExercise(exercise: Exercise, input: AnswerInput): GradeResult {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'fillBlank':
    case 'chooseImage':
      return gradeChoice(exercise, input);

    case 'typeTranslation': {
      const expected = exercise.expected[0] ?? null;
      if (input.kind !== 'text') return { correct: false, expected };
      return {
        correct: matchesExpected(input.value, exercise.expected, exercise.acceptTypos),
        expected,
      };
    }

    case 'typeWhatYouHear': {
      const expected = exercise.expected[0] ?? null;
      if (input.kind !== 'text') return { correct: false, expected };
      return { correct: matchesExpected(input.value, exercise.expected, false), expected };
    }

    case 'wordBank':
    case 'arrangeSentence': {
      const expected = exercise.answer.join(' ');
      if (input.kind !== 'tokens') return { correct: false, expected };
      const given = input.value.map(normalizeAnswer);
      const wanted = exercise.answer.map(normalizeAnswer);
      const inOrder = given.length === wanted.length && given.every((token, i) => token === wanted[i]);
      const joined = normalizeAnswer(input.value.join(' ')) === normalizeAnswer(exercise.answer.join(' '));
      return { correct: inOrder || joined, expected };
    }

    case 'matchPairs': {
      if (input.kind !== 'pairs') return { correct: false, expected: null };
      return { correct: input.mismatches === 0, expected: null };
    }

    case 'speak': {
      const expected = exercise.expected[0] ?? null;
      if (input.kind !== 'speak') return { correct: false, expected };
      const said = input.transcript.length > 0 && matchesExpected(input.transcript, exercise.expected, false);
      const correct = said || (exercise.softScore && input.selfReported);
      return { correct, expected };
    }

    default:
      return { correct: false, expected: null };
  }
}
