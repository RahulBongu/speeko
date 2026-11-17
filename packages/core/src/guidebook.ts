/**
 * Guidebook extraction.
 *
 * The unit guidebook previews the target-language items a learner will meet
 * on the path. Everything here is derived from tracked course exercises —
 * never hand-authored content — so the guidebook cannot claim to know more
 * than the lesson does. `matchPairs` contributes each individual member of
 * the pair instead of the fused string.
 */

import type { Exercise } from './content.js';

export interface GuidebookItem {
  /** The target-language string to preview. */
  target: string;
  /** The prompt of the first exercise that produced this item. */
  prompt: string;
  /** The exercise kind that produced this item. */
  kind: Exercise['kind'];
}

/** Target-language strings a single exercise contributes to a guidebook. */
export function guidebookTargets(exercise: Exercise): string[] {
  switch (exercise.kind) {
    case 'chooseMeaning':
    case 'listenChoose':
    case 'chooseImage':
    case 'fillBlank': {
      const target = exercise.options[exercise.answerIndex];
      return target ? [target] : [];
    }
    case 'typeTranslation':
    case 'typeWhatYouHear':
    case 'speak': {
      const target = exercise.expected[0];
      return target ? [target] : [];
    }
    case 'wordBank':
    case 'arrangeSentence': {
      const target = exercise.answer.join(' ');
      return target ? [target] : [];
    }
    case 'matchPairs':
      return exercise.pairs.map(([, target]) => target);
    default:
      return [];
  }
}

/**
 * Deduplicated, first-seen-ordered guidebook items for a list of exercises
 * (this is normally everything inside one unit). Boards that cannot produce a
 * target string are skipped rather than rendered as blanks.
 */
export function guidebookItems(exercises: readonly Exercise[]): GuidebookItem[] {
  const byTarget = new Map<string, GuidebookItem>();
  for (const exercise of exercises) {
    for (const target of guidebookTargets(exercise)) {
      if (!target) continue;
      if (!byTarget.has(target)) {
        byTarget.set(target, { target, prompt: exercise.prompt, kind: exercise.kind });
      }
    }
  }
  return [...byTarget.values()];
}
