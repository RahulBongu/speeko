// Skill identification for spaced repetition.
//
// A "skill" is one piece of knowledge the learner is acquiring — the
// target-language word or phrase practiced by an exercise. The same word
// practiced in different exercise kinds (recognition, typing, listening)
// maps to the same skill so SRS is exercised once per concept.

import type { Locale } from './locale.js';
import type { Exercise } from './content.js';

export function normalizeSkillText(text: string): string {
  return text.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');
}

/**
 * Extracts the target-language text an exercise is training, if any.
 * Returns null for exercises that carry no single trainable item.
 */
export function targetTextFor(exercise: Exercise): string | null {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'chooseImage':
    case 'fillBlank':
      return exercise.options[exercise.answerIndex] ?? null;
    case 'typeTranslation':
    case 'typeWhatYouHear':
    case 'speak':
      return exercise.expected[0] ?? null;
    case 'wordBank':
    case 'arrangeSentence':
      return exercise.answer.length > 0 ? exercise.answer.join(' ') : null;
    case 'matchPairs':
      return exercise.pairs.map(([, target]) => target).join('|');
    default:
      return null;
  }
}

export function skillIdFor(locale: Locale, exercise: Exercise): string | null {
  const target = targetTextFor(exercise);
  if (!target) return null;
  const normalized = normalizeSkillText(target);
  if (!normalized) return null;
  return `${locale}:${normalized}`;
}

/** Quality score (0..5) from an answered exercise outcome; <3 is a miss. */
export function qualityForOutcome(correct: boolean, hadPriorMiss: boolean): number {
  if (!correct) return 2; // incorrect but remembered — SM-2 "hard" grade
  return hadPriorMiss ? 4 : 5; // 5 = perfect recall, 4 = correct with effort
}
