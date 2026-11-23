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

/** Visual moods the vector fox supports on both web and mobile. */
export type FoxMood =
  | 'idle'
  | 'listening'
  | 'talking'
  | 'happy'
  | 'sad'
  | 'celebrate'
  | 'encouraging';

/** Independent motion states derived from app events. */
export type FoxAnimation =
  | 'breathe'
  | 'blink'
  | 'headBob'
  | 'tailSway'
  | 'earFlick'
  | 'talk'
  | 'bounce'
  | 'confused'
  | 'celebrate'
  | 'wave'
  | 'nod';

export interface FoxAnimationInput {
  /** Semantic mood. `correct`/`incorrect` are accepted aliases for feedback. */
  mood?: FoxMood | 'correct' | 'incorrect';
  /** True while a mascot voice line is playing. */
  speaking?: boolean;
  /** True while an audio prompt is playing. */
  listening?: boolean;
  /** True for one tap interaction. Highest priority below celebration. */
  tapped?: boolean;
}

export interface FoxAnimationState {
  mood: FoxMood;
  animation: FoxAnimation;
  label: string;
  speaking: boolean;
  listening: boolean;
  waving: boolean;
  /** True when a short confused reaction should be followed by encouragement. */
  encourageAfter: boolean;
}

const FOX_LABEL: Record<FoxMood, string> = {
  idle: 'Speeko the fox, ready to learn',
  listening: 'Speeko the fox, listening',
  talking: 'Speeko the fox, talking',
  happy: 'Speeko the fox, delighted',
  sad: 'Speeko the fox, a little confused',
  celebrate: 'Speeko the fox, celebrating',
  encouraging: 'Speeko the fox, encouraging you',
};

/**
 * Maps real app events to one unambiguous fox pose.
 *
 * Priority: celebration > tap > speaking > listening > feedback > idle. Keeping
 * this in core means the web and mobile components cannot drift apart, and the
 * mapping is unit-testable without rendering SVG.
 */
export function resolveFoxAnimation(input: FoxAnimationInput = {}): FoxAnimationState {
  const base = {
    speaking: Boolean(input.speaking),
    listening: Boolean(input.listening),
    waving: false,
    encourageAfter: false,
  };
  const tapped = Boolean(input.tapped);
  const feedbackMood = input.mood === 'incorrect' ? 'sad' : input.mood;

  if (input.mood === 'celebrate' || (tapped && feedbackMood !== 'sad')) {
    return {
      ...base,
      mood: tapped && input.mood !== 'celebrate' ? 'happy' : 'celebrate',
      animation: tapped && input.mood !== 'celebrate' ? 'wave' : 'celebrate',
      label: tapped && input.mood !== 'celebrate' ? 'Speeko the fox, waving hello' : FOX_LABEL.celebrate,
      waving: tapped,
    };
  }

  if (base.speaking || input.mood === 'talking') {
    return { ...base, mood: 'talking', animation: 'talk', label: FOX_LABEL.talking };
  }

  if (base.listening || input.mood === 'listening') {
    return { ...base, mood: 'listening', animation: 'headBob', label: FOX_LABEL.listening };
  }

  if (input.mood === 'correct' || input.mood === 'happy') {
    return { ...base, mood: 'happy', animation: 'bounce', label: FOX_LABEL.happy };
  }

  if (input.mood === 'incorrect' || input.mood === 'sad') {
    return {
      ...base,
      mood: 'sad',
      animation: 'confused',
      label: FOX_LABEL.sad,
      encourageAfter: true,
    };
  }

  if (input.mood === 'encouraging') {
    return { ...base, mood: 'encouraging', animation: 'nod', label: FOX_LABEL.encouraging };
  }

  return { ...base, mood: 'idle', animation: 'breathe', label: FOX_LABEL.idle };
}

/** Map a semantic mascot reaction to a fox mood. */
export function foxMoodForReaction(reactionId: MascotReactionId): FoxMood {
  switch (reactionId) {
    case 'correct_answer':
      return 'happy';
    case 'incorrect_answer':
      return 'sad';
    case 'lesson_complete':
    case 'streak_milestone':
      return 'celebrate';
    case 'discovery':
      return 'listening';
    case 'encouragement':
      return 'encouraging';
  }
}

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
