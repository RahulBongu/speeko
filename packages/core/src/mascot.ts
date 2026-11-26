/**
 * Mascot reaction system.
 *
 * A small semantic catalog of fox reactions the learning flow can emit. Both
 * web and native mobile consume the same catalog so behavior stays consistent.
 * Audio asset resolution differs per platform (bundled MP3 paths).
 */

export type MascotState =
  | 'idle'
  | 'greeting'
  | 'excited'
  | 'thinking'
  | 'correct_answer'
  | 'incorrect_supportive'
  | 'encouragement'
  | 'talking'
  | 'listening'
  | 'surprise'
  | 'lesson_complete'
  | 'victory_dance'
  | 'sleepy'
  | 'curious_discovery'
  | 'welcome_back';

export type MascotReactionId =
  | 'correct_answer'
  | 'incorrect_answer'
  | 'lesson_complete'
  | 'unit_complete'
  | 'discovery'
  | 'streak_milestone'
  | 'encouragement';

export type MascotAnimation = 'bounce' | 'wiggle' | 'celebrate' | 'nod';

/** Visual moods and semantic states the vector fox supports on both web and mobile. */
export type FoxMood =
  | 'idle'
  | 'listening'
  | 'talking'
  | 'happy'
  | 'sad'
  | 'celebrate'
  | 'encouraging'
  | MascotState;

/** Independent motion states derived from app events and Flow reference clips. */
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
  | 'nod'
  | 'thinking'
  | 'excited'
  | 'surprise'
  | 'victoryDance'
  | 'sleepy'
  | 'curious'
  | 'welcomeBack';

export type FoxEyeStyle = 'open' | 'crescent' | 'wide' | 'sleepy' | 'soft';
export type FoxMouthStyle = 'smile' | 'open' | 'softSmile' | 'thoughtful' | 'oval' | 'talk';
export type FoxEarPose = 'neutral' | 'perked' | 'droop' | 'curious';
export type FoxPawPose =
  | 'rest'
  | 'wave'
  | 'chin'
  | 'cheer'
  | 'reassure'
  | 'cheeks'
  | 'dance'
  | 'yawn'
  | 'curious';
export type FoxTailStyle = 'sway' | 'wagFast' | 'relaxed' | 'tucked';
export type FoxIntensity = 'normal' | 'super' | 'ultra';

export interface MascotStateMeta {
  state: MascotState;
  priority: number;
  /** Non-null ms when a transient reaction should automatically recover to `idle`. */
  settleAfterMs: number | null;
}

export const MASCOT_STATE_META: Record<MascotState, MascotStateMeta> = {
  idle: { state: 'idle', priority: 0, settleAfterMs: null },
  sleepy: { state: 'sleepy', priority: 20, settleAfterMs: null },
  thinking: { state: 'thinking', priority: 30, settleAfterMs: null },
  curious_discovery: { state: 'curious_discovery', priority: 35, settleAfterMs: 2600 },
  listening: { state: 'listening', priority: 45, settleAfterMs: null },
  talking: { state: 'talking', priority: 50, settleAfterMs: null },
  excited: { state: 'excited', priority: 60, settleAfterMs: 2000 },
  encouragement: { state: 'encouragement', priority: 65, settleAfterMs: 1800 },
  greeting: { state: 'greeting', priority: 68, settleAfterMs: 1700 },
  welcome_back: { state: 'welcome_back', priority: 70, settleAfterMs: 2200 },
  incorrect_supportive: { state: 'incorrect_supportive', priority: 82, settleAfterMs: 2200 },
  correct_answer: { state: 'correct_answer', priority: 85, settleAfterMs: 1500 },
  surprise: { state: 'surprise', priority: 95, settleAfterMs: 1600 },
  victory_dance: { state: 'victory_dance', priority: 115, settleAfterMs: 3200 },
  lesson_complete: { state: 'lesson_complete', priority: 120, settleAfterMs: null },
};

export interface FoxAnimationInput {
  /** Semantic mood or state. `correct`/`incorrect` are accepted aliases for feedback. */
  mood?: FoxMood | 'correct' | 'incorrect';
  /** True while a mascot voice line is playing. */
  speaking?: boolean;
  /** True while an audio prompt is playing. */
  listening?: boolean;
  /** True for one tap interaction. Highest priority below celebration. */
  tapped?: boolean;
  /** Consecutive correct answers in the session; escalates jump energy at 3+ and 5+. */
  combo?: number;
}

export interface FoxAnimationState {
  mood: FoxMood;
  semanticState: MascotState;
  animation: FoxAnimation;
  label: string;
  speaking: boolean;
  listening: boolean;
  waving: boolean;
  /** True when a short confused reaction should be followed by encouragement. */
  encourageAfter: boolean;
  /** Jump/celebration energy level driven by answer streaks. */
  intensity: FoxIntensity;
  eyeStyle: FoxEyeStyle;
  mouthStyle: FoxMouthStyle;
  earPose: FoxEarPose;
  pawPose: FoxPawPose;
  tailStyle: FoxTailStyle;
  priority: number;
  settleAfterMs: number | null;
}

const FOX_LABEL: Record<MascotState, string> = {
  idle: 'Speeko the fox, ready to learn',
  greeting: 'Speeko the fox, waving hello',
  excited: 'Speeko the fox, excited',
  thinking: 'Speeko the fox, thinking thoughtfully',
  correct_answer: 'Speeko the fox, delighted',
  incorrect_supportive: 'Speeko the fox, a little confused',
  encouragement: 'Speeko the fox, encouraging you',
  talking: 'Speeko the fox, talking',
  listening: 'Speeko the fox, listening',
  surprise: 'Speeko the fox, pleasantly surprised',
  lesson_complete: 'Speeko the fox, celebrating',
  victory_dance: 'Speeko the fox, doing a victory dance',
  sleepy: 'Speeko the fox, sleepy and yawning',
  curious_discovery: 'Speeko the fox, curious about something new',
  welcome_back: 'Speeko the fox, welcoming you back',
};

function makeState(
  mood: FoxMood,
  semanticState: MascotState,
  animation: FoxAnimation,
  base: { speaking: boolean; listening: boolean; intensity: FoxIntensity },
  rig: {
    waving?: boolean;
    encourageAfter?: boolean;
    eyeStyle?: FoxEyeStyle;
    mouthStyle?: FoxMouthStyle;
    earPose?: FoxEarPose;
    pawPose?: FoxPawPose;
    tailStyle?: FoxTailStyle;
  } = {},
  customLabel?: string,
): FoxAnimationState {
  const meta = MASCOT_STATE_META[semanticState];
  return {
    mood,
    semanticState,
    animation,
    label: customLabel ?? FOX_LABEL[semanticState],
    speaking: base.speaking,
    listening: base.listening,
    waving: rig.waving ?? false,
    encourageAfter: rig.encourageAfter ?? false,
    intensity: base.intensity,
    eyeStyle: rig.eyeStyle ?? 'open',
    mouthStyle: rig.mouthStyle ?? (base.speaking ? 'talk' : 'open'),
    earPose: rig.earPose ?? 'neutral',
    pawPose: rig.pawPose ?? 'rest',
    tailStyle: rig.tailStyle ?? 'sway',
    priority: meta.priority,
    settleAfterMs: meta.settleAfterMs,
  };
}

/**
 * Decides whether a candidate state can replace a currently active state
 * cleanly without stacking or letting low-priority motion cut off a celebration.
 */
export function resolveMascotTransition(
  current: MascotState,
  candidate: MascotState,
  opts: { currentSettled?: boolean; force?: boolean } = {},
): MascotState {
  if (opts.force || candidate === 'idle' || opts.currentSettled) {
    return candidate;
  }
  const currentMeta = MASCOT_STATE_META[current];
  const nextMeta = MASCOT_STATE_META[candidate];
  if (nextMeta.priority >= currentMeta.priority) {
    return candidate;
  }
  return current;
}

/**
 * Maps real app events to one unambiguous fox pose across all 15 Flow-guided
 * semantic states. Keeping this in core means web and mobile cannot drift apart
 * and every pose/priority transition is unit-testable without rendering SVG.
 */
export function resolveFoxAnimation(input: FoxAnimationInput = {}): FoxAnimationState {
  const combo = Math.max(0, Math.floor(input.combo ?? 0));
  const intensity: FoxIntensity =
    combo >= 5 ? 'ultra' : combo >= 3 ? 'super' : 'normal';
  const base = {
    speaking: Boolean(input.speaking),
    listening: Boolean(input.listening),
    intensity,
  };
  const tapped = Boolean(input.tapped);
  const rawMood = input.mood ?? 'idle';
  const isNegative = rawMood === 'incorrect' || rawMood === 'sad' || rawMood === 'incorrect_supportive';

  if (rawMood === 'victory_dance') {
    return makeState('celebrate', 'victory_dance', 'victoryDance', base, {
      eyeStyle: 'crescent',
      mouthStyle: 'open',
      earPose: 'perked',
      pawPose: 'dance',
      tailStyle: 'wagFast',
    });
  }

  if (rawMood === 'celebrate' || rawMood === 'lesson_complete') {
    return makeState('celebrate', 'lesson_complete', 'celebrate', base, {
      eyeStyle: 'crescent',
      mouthStyle: base.speaking ? 'talk' : 'open',
      earPose: 'perked',
      pawPose: 'cheer',
      tailStyle: 'wagFast',
    });
  }

  if (tapped && !isNegative) {
    return makeState(
      'happy',
      'greeting',
      'wave',
      base,
      {
        waving: true,
        eyeStyle: 'open',
        mouthStyle: base.speaking ? 'talk' : 'open',
        earPose: 'perked',
        pawPose: 'wave',
        tailStyle: 'wagFast',
      },
      'Speeko the fox, waving hello',
    );
  }

  if (rawMood === 'surprise') {
    return makeState('happy', 'surprise', 'surprise', base, {
      eyeStyle: 'wide',
      mouthStyle: 'oval',
      earPose: 'perked',
      pawPose: 'cheeks',
      tailStyle: 'wagFast',
    });
  }

  if (base.speaking || rawMood === 'talking') {
    return makeState('talking', 'talking', 'talk', base, {
      eyeStyle: 'open',
      mouthStyle: 'talk',
      earPose: 'neutral',
      pawPose: 'wave',
      tailStyle: 'sway',
    });
  }

  if (base.listening || rawMood === 'listening') {
    return makeState('listening', 'listening', 'headBob', base, {
      eyeStyle: 'open',
      mouthStyle: 'smile',
      earPose: 'perked',
      pawPose: 'rest',
      tailStyle: 'sway',
    });
  }

  if (rawMood === 'welcome_back') {
    return makeState('happy', 'welcome_back', 'welcomeBack', base, {
      waving: true,
      eyeStyle: 'crescent',
      mouthStyle: 'open',
      earPose: 'perked',
      pawPose: 'wave',
      tailStyle: 'wagFast',
    });
  }

  if (rawMood === 'greeting') {
    return makeState('happy', 'greeting', 'wave', base, {
      waving: true,
      eyeStyle: 'open',
      mouthStyle: 'open',
      earPose: 'perked',
      pawPose: 'wave',
      tailStyle: 'sway',
    });
  }

  if (rawMood === 'excited') {
    return makeState('happy', 'excited', 'excited', base, {
      eyeStyle: 'crescent',
      mouthStyle: 'open',
      earPose: 'perked',
      pawPose: 'cheer',
      tailStyle: 'wagFast',
    });
  }

  if (rawMood === 'correct' || rawMood === 'happy' || rawMood === 'correct_answer') {
    return makeState('happy', 'correct_answer', 'bounce', base, {
      eyeStyle: intensity === 'normal' ? 'open' : 'crescent',
      mouthStyle: 'open',
      earPose: 'perked',
      pawPose: 'cheer',
      tailStyle: 'wagFast',
    });
  }

  if (isNegative) {
    return makeState('sad', 'incorrect_supportive', 'confused', base, {
      encourageAfter: true,
      eyeStyle: 'soft',
      mouthStyle: 'softSmile',
      earPose: 'droop',
      pawPose: 'reassure',
      tailStyle: 'relaxed',
    });
  }

  if (rawMood === 'encouraging' || rawMood === 'encouragement') {
    return makeState('encouraging', 'encouragement', 'nod', base, {
      eyeStyle: 'open',
      mouthStyle: 'open',
      earPose: 'neutral',
      pawPose: 'reassure',
      tailStyle: 'sway',
    });
  }

  if (rawMood === 'curious_discovery') {
    return makeState('idle', 'curious_discovery', 'curious', base, {
      eyeStyle: 'open',
      mouthStyle: 'smile',
      earPose: 'curious',
      pawPose: 'curious',
      tailStyle: 'sway',
    });
  }

  if (rawMood === 'thinking') {
    return makeState('idle', 'thinking', 'thinking', base, {
      eyeStyle: 'open',
      mouthStyle: 'thoughtful',
      earPose: 'curious',
      pawPose: 'chin',
      tailStyle: 'sway',
    });
  }

  if (rawMood === 'sleepy') {
    return makeState('idle', 'sleepy', 'sleepy', base, {
      eyeStyle: 'sleepy',
      mouthStyle: 'oval',
      earPose: 'droop',
      pawPose: 'yawn',
      tailStyle: 'relaxed',
    });
  }

  return makeState('idle', 'idle', 'breathe', base, {
    eyeStyle: 'open',
    mouthStyle: 'open',
    earPose: 'neutral',
    pawPose: 'rest',
    tailStyle: 'sway',
  });
}

/** Map a semantic mascot reaction to a fox mood. */
export function foxMoodForReaction(reactionId: MascotReactionId): FoxMood {
  switch (reactionId) {
    case 'correct_answer':
      return 'happy';
    case 'incorrect_answer':
      return 'sad';
    case 'lesson_complete':
    case 'unit_complete':
      return 'celebrate';
    case 'streak_milestone':
      return 'excited';
    case 'discovery':
      return 'curious_discovery';
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
      'Magnificent! That sounded effortless!',
      'Right on the money! Keep soaring!',
      'Genius pick! Clean answer!',
      'Super sharp! Right in the groove!',
    ],
    priority: 10,
    animation: 'bounce',
    audioKey: 'correct',
    audioKeys: [
      'correct',
      'correct-2',
      'correct-3',
      'correct-4',
      'correct-5',
      'correct-6',
      'correct-7',
      'correct-8',
      'correct-9',
    ],
    sfxKeys: ['correct', 'correct-2', 'correct-3', 'correct-4', 'correct-5'],
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
      'Almost had it! One quick look locks it in.',
      'Tough round! You will nail this next time.',
    ],
    priority: 10,
    animation: 'nod',
    audioKey: 'incorrect',
    audioKeys: [
      'incorrect',
      'incorrect-2',
      'incorrect-3',
      'incorrect-4',
      'incorrect-5',
      'incorrect-6',
    ],
    sfxKeys: ['incorrect', 'incorrect-2', 'incorrect-3'],
  },
  lesson_complete: {
    id: 'lesson_complete',
    phrases: [
      'Amazing work! Lesson conquered!',
      'Fantastic finish! You crushed every step!',
      'Woohoo! Your skills just leveled up!',
      'Brilliant run! Every step counted!',
      'Smooth finish! You breezed right through!',
      'Champion run! Every exercise clicked!',
      'Top-notch lesson! Your progress is soaring!',
    ],
    priority: 100,
    animation: 'celebrate',
    audioKey: 'complete',
    audioKeys: ['complete', 'complete-2', 'complete-3', 'complete-4', 'complete-5', 'complete-6'],
    sfxKeys: ['complete', 'complete-2', 'complete-3'],
  },
  unit_complete: {
    id: 'unit_complete',
    phrases: [
      'Module complete! You mastered every lesson in this unit!',
      'Unit conquered! Look how strong your foundation just got!',
      'What a milestone! Ready to cross into the next module?',
      'Whole module unlocked! That victory cheer is all yours!',
      'Brilliant unit finish! Onward to fresh words!',
      'Every lesson in this module cleared! Look at you climbing!',
      'Mastery unlocked! Your fox is throwing confetti!',
      'Outstanding module run! Next chapter awaits on the trail!',
    ],
    priority: 120,
    animation: 'celebrate',
    audioKey: 'unit-complete',
    audioKeys: [
      'unit-complete',
      'unit-complete-2',
      'unit-complete-3',
      'unit-complete-4',
      'unit-complete-5',
      'unit-complete-6',
    ],
    sfxKeys: ['unit-complete', 'unit-complete-2', 'unit-complete-3'],
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

export interface MascotVarietyStorage {
  load(): string | null;
  save(snapshot: string): void;
}

interface VarietySnapshot {
  bags?: Record<string, number[]>;
  lastPicked?: Record<string, number>;
}

/**
 * Stateful shuffle-bag picker so consecutive correct/incorrect answers and
 * module completions never repeat the same appreciation message, voice clip,
 * or chime back-to-back, even across separate lesson sessions when backed by
 * storage.
 */
export function createMascotVarietyPicker(
  random: () => number = Math.random,
  storage?: MascotVarietyStorage,
) {
  const bags = new Map<string, number[]>();
  const lastPicked = new Map<string, number>();
  let hydrated = false;

  function hydrate() {
    if (hydrated) return;
    hydrated = true;
    if (!storage) return;
    try {
      const raw = storage.load();
      if (!raw) return;
      const parsed = JSON.parse(raw) as VarietySnapshot | null;
      if (!parsed || typeof parsed !== 'object') return;
      if (parsed.bags && typeof parsed.bags === 'object') {
        for (const [k, arr] of Object.entries(parsed.bags)) {
          if (Array.isArray(arr)) {
            bags.set(
              k,
              arr.filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0),
            );
          }
        }
      }
      if (parsed.lastPicked && typeof parsed.lastPicked === 'object') {
        for (const [k, v] of Object.entries(parsed.lastPicked)) {
          if (typeof v === 'number' && Number.isInteger(v) && v >= 0) {
            lastPicked.set(k, v);
          }
        }
      }
    } catch {
      // Ignore corrupt snapshots.
    }
  }

  function persist() {
    if (!storage) return;
    try {
      const snapshot: VarietySnapshot = {
        bags: Object.fromEntries(bags.entries()),
        lastPicked: Object.fromEntries(lastPicked.entries()),
      };
      storage.save(JSON.stringify(snapshot));
    } catch {
      // Ignore storage write errors.
    }
  }

  function drawIndex(bucketKey: string, length: number): number {
    hydrate();
    if (length <= 1) return 0;
    let bag = (bags.get(bucketKey) ?? []).filter((idx) => idx >= 0 && idx < length);
    if (bag.length === 0) {
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
    }
    const next = bag.pop()!;
    bags.set(bucketKey, bag);
    lastPicked.set(bucketKey, next);
    persist();
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
    pickSfxKey(kind: 'correct' | 'incorrect' | 'complete' | 'unit_complete'): string {
      const reactionId: MascotReactionId =
        kind === 'correct'
          ? 'correct_answer'
          : kind === 'incorrect'
            ? 'incorrect_answer'
            : kind === 'unit_complete'
              ? 'unit_complete'
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
