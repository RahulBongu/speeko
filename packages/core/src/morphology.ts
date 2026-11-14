// Per-locale morphology hook. The exercise generator uses this to produce
// plausible distractors instead of random strings. Implementations live in
// packages/content (one per locale).

export interface MorphologyProfile {
  readonly locale: string;
  /** Gender of a noun/word if the language marks it. */
  genderOf(word: string): 'm' | 'f' | 'n' | null;
  /** Plural form of a noun (or null if not applicable). */
  pluralize(word: string): string | null;
  /** Inflect a verb for a given person/number/tense. */
  conjugate(lemma: string, person: 1 | 2 | 3, number: 'sg' | 'pl', tense: 'present' | 'past' | 'future'): string | null;
  /** Produce N plausible distractors for a target word. */
  distractors(target: string, count: number): string[];
  /** Transliterate from this script to Latin (ISO-ish). */
  transliterateToLatin(text: string): string;
  /** Transliterate from Latin to this script. */
  transliterateFromLatin(text: string): string;
  /** Native digit string for a number. */
  nativeDigits(n: number): string;
}

export const NOOP_MORPHOLOGY: MorphologyProfile = {
  locale: 'en',
  genderOf: () => null,
  pluralize: (w) => w + 's',
  conjugate: (lemma) => lemma,
  distractors: (target, count) => Array.from({ length: count }, (_, i) => `${target}_${i}`),
  transliterateToLatin: (t) => t,
  transliterateFromLatin: (t) => t,
  nativeDigits: (n) => String(n),
};
