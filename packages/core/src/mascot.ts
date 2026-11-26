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
  /** Default filename of the bundled English reaction audio (no extension). */
  audioKey: string;
  /** All varied audio clip keys for this reaction (without extension). */
  audioKeys: string[];
  /** Matching sound-effect clip keys for this reaction (without extension). */
  sfxKeys: string[];
}

export const MASCOT_REACTIONS: Record<MascotReactionId, MascotReaction> = {
  correct_answer: {
    id: 'correct_answer',
    phrases: [
      'Hurray! You nailed it!',
      'Spot on! Keep that momentum going!',
      'Woohoo! Clean and sharp!',
      'Awesome work! Look at you go!',
      'Boom! That answer was pure gold!',
      "Yes! That's the one!",
      'Crisp! Your ear is getting sharp!',
      'Unstoppable! Right on target!',
    ],
    priority: 10,
    animation: 'bounce',
    audioKey: 'correct',
    audioKeys: ['correct', 'correct-2', 'correct-3', 'correct-4', 'correct-5'],
    sfxKeys: ['correct', 'correct-2', 'correct-3', 'correct-4'],
  },
  incorrect_answer: {
    id: 'incorrect_answer',
    phrases: [
      "Ooh, close! Let's peek at the right one.",
      'Not quite yet — every miss sharpens your ear!',
      'Tricky one! Shake it off and keep rolling.',
      "Good try! You'll lock this in next time.",
      "Almost! We've got this together.",
      'No worries — every correction builds memory!',
    ],
    priority: 10,
    animation: 'nod',
    audioKey: 'incorrect',
    audioKeys: ['incorrect', 'incorrect-2', 'incorrect-3', 'incorrect-4'],
    sfxKeys: ['incorrect', 'incorrect-2', 'incorrect-3'],
  },
  lesson_complete: {
    id: 'lesson_complete',
    phrases: [
      'Amazing work! Lesson conquered!',
      'Fantastic finish! You crushed every step!',
      'Woohoo! Your skills just leveled up!',
      'Brilliant run! Every step counted!',
    ],
    priority: 100,
    animation: 'celebrate',
    audioKey: 'complete',
    audioKeys: ['complete', 'complete-2', 'complete-3'],
    sfxKeys: ['complete', 'complete-2'],
  },
  discovery: {
    id: 'discovery',
    phrases: [
      "Ooh, let's learn something fresh today!",
      'Ready for a fun new challenge? Let us dive in!',
      "Hey, here's something interesting!",
    ],
    priority: 20,
    animation: 'wiggle',
    audioKey: 'discovery',
    audioKeys: ['discovery', 'discovery-2'],
    sfxKeys: [],
  },
  streak_milestone: {
    id: 'streak_milestone',
    phrases: [
      'Your streak is growing! Unstoppable!',
      'What a combo! You are on fire!',
      'Look how far you have come!',
    ],
    priority: 90,
    animation: 'celebrate',
    audioKey: 'streak',
    audioKeys: ['streak', 'streak-2'],
    sfxKeys: ['complete-2'],
  },
  encouragement: {
    id: 'encouragement',
    phrases: [
      "Let's figure it out together, step by step.",
      'Every single try makes your memory stronger.',
      'Stay steady — small steps build fluency fast!',
    ],
    priority: 15,
    animation: 'nod',
    audioKey: 'encouragement',
    audioKeys: ['encouragement', 'encouragement-2'],
    sfxKeys: [],
  },
};

/** Deterministic phrase pick: stable for a given seed. */
export function pickMascotPhrase(reaction: MascotReaction, seed: number): string {
  if (reaction.phrases.length === 0) return '';
  const index = Math.abs(Math.trunc(seed)) % reaction.phrases.length;
  return reaction.phrases[index]!;
}

/** Deterministic audio clip pick: rotates through all bundled variants for a seed. */
export function pickMascotAudioKey(reaction: MascotReaction, seed = 0): string {
  const pool = reaction.audioKeys.length > 0 ? reaction.audioKeys : [reaction.audioKey];
  const index = Math.abs(Math.trunc(seed)) % pool.length;
  return pool[index] ?? reaction.audioKey;
}

export interface VariedReactionPick {
  reactionId: MascotReactionId;
  phrase: string;
  audioKey: string;
  sfxKey: string | null;
}

/**
 * Stateful shuffle-bag picker so consecutive correct/incorrect answers never
 * play the same appreciation message, voice clip, or chime back-to-back.
 */
export function createMascotVarietyPicker(random: () => number = Math.random) {
  const bags = new Map<string, number[]>();
  const lastPicked = new Map<string, number>();

  function drawIndex(bucketKey: string, length: number): number {
    if (length <= 1) return 0;
    let bag = bags.get(bucketKey);
    if (!bag || bag.length === 0) {
      bag = Array.from({ length }, (_, index) => index);
      // Fisher-Yates shuffle
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1)) % (i + 1);
        const tmp = bag[i]!;
        bag[i] = bag[j]!;
        bag[j] = tmp;
      }
      // Avoid immediate repeat across bag refill boundary.
      const prev = lastPicked.get(bucketKey);
      if (prev !== undefined && bag[bag.length - 1] === prev && bag.length > 1) {
        const swapIdx = 0;
        const tmp = bag[bag.length - 1]!;
        bag[bag.length - 1] = bag[swapIdx]!;
        bag[swapIdx] = tmp;
      }
      bags.set(bucketKey, bag);
    }
    const next = bag.pop()!;
    lastPicked.set(bucketKey, next);
    return next;
  }

  return {
    pick(reactionId: MascotReactionId): VariedReactionPick {
      const reaction = MASCOT_REACTIONS[reactionId];
      const phraseIndex = drawIndex(`phrase:${reactionId}`, reaction.phrases.length);
      const audioPool = reaction.audioKeys.length > 0 ? reaction.audioKeys : [reaction.audioKey];
      const audioIndex = drawIndex(`audio:${reactionId}`, audioPool.length);
      const sfxKey =
        reaction.sfxKeys.length > 0
          ? reaction.sfxKeys[drawIndex(`sfx:${reactionId}`, reaction.sfxKeys.length)] ?? null
          : null;
      return {
        reactionId,
        phrase: reaction.phrases[phraseIndex] ?? '',
        audioKey: audioPool[audioIndex] ?? reaction.audioKey,
        sfxKey,
      };
    },
    pickAudioKey(reactionId: MascotReactionId): string {
      const reaction = MASCOT_REACTIONS[reactionId];
      const audioPool = reaction.audioKeys.length > 0 ? reaction.audioKeys : [reaction.audioKey];
      const audioIndex = drawIndex(`audio:${reactionId}`, audioPool.length);
      return audioPool[audioIndex] ?? reaction.audioKey;
    },
    pickSfxKey(kind: 'correct' | 'incorrect' | 'complete'): string {
      const reactionId: MascotReactionId =
        kind === 'correct'
          ? 'correct_answer'
          : kind === 'incorrect'
            ? 'incorrect_answer'
            : 'lesson_complete';
      const reaction = MASCOT_REACTIONS[reactionId];
      if (reaction.sfxKeys.length === 0) return kind;
      const idx = drawIndex(`sfx:${kind}`, reaction.sfxKeys.length);
      return reaction.sfxKeys[idx] ?? kind;
    },
  };
}

export function mascotReaction(id: MascotReactionId): MascotReaction {
  return MASCOT_REACTIONS[id];
}
