/**
 * Mascot reaction system.
 *
 * A small semantic catalog of fox reactions the learning flow can emit. Both
 * web and native mobile consume the same catalog so behavior stays consistent.
 * Audio asset resolution differs per platform (bundled MP3 paths).
 */

export type MascotReactionId =
  | 'correct_answer'
  | 'incorrect_answer'
  | 'lesson_complete'
  | 'discovery'
  | 'streak_milestone'
  | 'encouragement';

export type MascotAnimation = 'bounce' | 'wiggle' | 'celebrate' | 'nod';

export interface MascotReaction {
  id: MascotReactionId;
  phrases: string[];
  priority: number;
  animation: MascotAnimation;
  /** Filename of the bundled English reaction audio (no extension here). */
  audioKey: string;
}

export const MASCOT_REACTIONS: Record<MascotReactionId, MascotReaction> = {
  correct_answer: {
    id: 'correct_answer',
    phrases: ['Hurray! You did it!', "Yes! That's the one!", 'Amazing work!', 'Great job!'],
    priority: 10,
    animation: 'bounce',
    audioKey: 'correct',
  },
  incorrect_answer: {
    id: 'incorrect_answer',
    phrases: ["Almost! Let's try again.", "No worries. We've got this.", 'Take your time. I am here.'],
    priority: 10,
    animation: 'nod',
    audioKey: 'incorrect',
  },
  lesson_complete: {
    id: 'lesson_complete',
    phrases: ['Hurray! You did it!', 'Amazing work!', 'A new achievement! Fantastic!', 'That was brilliant!'],
    priority: 100,
    animation: 'celebrate',
    audioKey: 'complete',
  },
  discovery: {
    id: 'discovery',
    phrases: ['Ooh, let us learn something new!', 'Ready for a little challenge?', "Hey, here's something interesting!"],
    priority: 20,
    animation: 'wiggle',
    audioKey: 'discovery',
  },
  streak_milestone: {
    id: 'streak_milestone',
    phrases: ['Your streak is growing!', 'Look how far you have come!', 'You are on fire!'],
    priority: 90,
    animation: 'celebrate',
    audioKey: 'streak',
  },
  encouragement: {
    id: 'encouragement',
    phrases: ["Let's figure it out together.", 'Every try makes you stronger.'],
    priority: 15,
    animation: 'nod',
    audioKey: 'encouragement',
  },
};

/** Deterministic phrase pick: stable for a given seed. */
export function pickMascotPhrase(reaction: MascotReaction, seed: number): string {
  if (reaction.phrases.length === 0) return '';
  const index = Math.abs(Math.trunc(seed)) % reaction.phrases.length;
  return reaction.phrases[index]!;
}

export function mascotReaction(id: MascotReactionId): MascotReaction {
  return MASCOT_REACTIONS[id];
}
