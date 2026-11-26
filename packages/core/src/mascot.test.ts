import { describe, expect, it } from 'vitest';
import {
  MASCOT_REACTIONS,
  MASCOT_STATE_META,
  createMascotVarietyPicker,
  foxMoodForReaction,
  mascotReaction,
  pickMascotAudioKey,
  pickMascotPhrase,
  resolveFoxAnimation,
  resolveMascotTransition,
  type MascotState,
} from './mascot.js';

describe('MASCOT_REACTIONS', () => {
  it('has a reaction for every semantic event used by the apps', () => {
    expect(MASCOT_REACTIONS.correct_answer).toBeDefined();
    expect(MASCOT_REACTIONS.incorrect_answer).toBeDefined();
    expect(MASCOT_REACTIONS.lesson_complete).toBeDefined();
    expect(MASCOT_REACTIONS.unit_complete).toBeDefined();
    expect(MASCOT_REACTIONS.discovery).toBeDefined();
    expect(MASCOT_REACTIONS.streak_milestone).toBeDefined();
    expect(MASCOT_REACTIONS.encouragement).toBeDefined();
  });

  it('assigns lesson and unit completion highest priority', () => {
    expect(mascotReaction('lesson_complete').priority).toBeGreaterThan(
      mascotReaction('correct_answer').priority,
    );
    expect(mascotReaction('unit_complete').priority).toBeGreaterThan(
      mascotReaction('lesson_complete').priority,
    );
  });

  it('gives every reaction at least one phrase and a valid animation', () => {
    const allowed = new Set(['bounce', 'wiggle', 'celebrate', 'nod']);
    for (const reaction of Object.values(MASCOT_REACTIONS)) {
      expect(reaction.phrases.length).toBeGreaterThan(0);
      expect(allowed.has(reaction.animation)).toBe(true);
    }
  });
});

describe('resolveFoxAnimation', () => {
  it('maps idle to a calm breathing pose', () => {
    const state = resolveFoxAnimation({ mood: 'idle' });
    expect(state.mood).toBe('idle');
    expect(state.animation).toBe('breathe');
    expect(state.speaking).toBe(false);
    expect(state.listening).toBe(false);
  });

  it('lets a speaking voice line override listening and feedback', () => {
    const state = resolveFoxAnimation({ mood: 'correct', speaking: true, listening: true });
    expect(state.mood).toBe('talking');
    expect(state.animation).toBe('talk');
  });

  it('uses an attentive pose while an audio prompt plays', () => {
    const state = resolveFoxAnimation({ listening: true });
    expect(state.mood).toBe('listening');
    expect(state.animation).toBe('headBob');
  });

  it('escalates celebratory intensity at 3+ and 5+ answer combos', () => {
    expect(resolveFoxAnimation({ mood: 'correct', combo: 1 }).intensity).toBe('normal');
    expect(resolveFoxAnimation({ mood: 'correct', combo: 3 }).intensity).toBe('super');
    expect(resolveFoxAnimation({ mood: 'celebrate', combo: 5 }).intensity).toBe('ultra');
    expect(resolveFoxAnimation({ mood: 'correct', combo: -4 }).intensity).toBe('normal');
  });

  it('maps grading aliases to distinct happy and confused reactions', () => {
    const correct = resolveFoxAnimation({ mood: 'correct' });
    const incorrect = resolveFoxAnimation({ mood: 'incorrect' });
    expect(correct.animation).toBe('bounce');
    expect(incorrect.animation).toBe('confused');
    expect(incorrect.encourageAfter).toBe(true);
  });

  it('keeps celebration above speech and tap waves above idle', () => {
    expect(resolveFoxAnimation({ mood: 'celebrate', speaking: true }).animation).toBe('celebrate');
    const wave = resolveFoxAnimation({ mood: 'idle', tapped: true });
    expect(wave.animation).toBe('wave');
    expect(wave.waving).toBe(true);
  });

  it('does not start a wave during a confused reaction', () => {
    const state = resolveFoxAnimation({ mood: 'incorrect', tapped: true });
    expect(state.animation).toBe('confused');
    expect(state.waving).toBe(false);
  });
});

describe('foxMoodForReaction', () => {
  it('maps every semantic reaction to a fox mood', () => {
    expect(foxMoodForReaction('correct_answer')).toBe('happy');
    expect(foxMoodForReaction('incorrect_answer')).toBe('sad');
    expect(foxMoodForReaction('lesson_complete')).toBe('celebrate');
    expect(foxMoodForReaction('unit_complete')).toBe('celebrate');
    expect(foxMoodForReaction('streak_milestone')).toBe('excited');
    expect(foxMoodForReaction('discovery')).toBe('curious_discovery');
    expect(foxMoodForReaction('encouragement')).toBe('encouraging');
  });

  it('resolves all 15 Flow-guided mascot states with coordinated facial and limb hints', () => {
    const allStates: MascotState[] = [
      'idle',
      'greeting',
      'excited',
      'thinking',
      'correct_answer',
      'incorrect_supportive',
      'encouragement',
      'talking',
      'listening',
      'surprise',
      'lesson_complete',
      'victory_dance',
      'sleepy',
      'curious_discovery',
      'welcome_back',
    ];
    for (const s of allStates) {
      const resolved = resolveFoxAnimation({ mood: s });
      expect(resolved.semanticState).toBe(s);
      expect(resolved.label).toBeTruthy();
      expect(MASCOT_STATE_META[s]).toBeDefined();
    }
    expect(resolveFoxAnimation({ mood: 'thinking' }).pawPose).toBe('chin');
    expect(resolveFoxAnimation({ mood: 'surprise' }).pawPose).toBe('cheeks');
    expect(resolveFoxAnimation({ mood: 'surprise' }).mouthStyle).toBe('oval');
    expect(resolveFoxAnimation({ mood: 'sleepy' }).eyeStyle).toBe('sleepy');
    expect(resolveFoxAnimation({ mood: 'victory_dance' }).animation).toBe('victoryDance');
    expect(resolveFoxAnimation({ mood: 'incorrect_supportive' }).earPose).toBe('droop');
  });

  it('enforces priority rules on animation interruption and allows explicit recovery to idle', () => {
    // Low-priority thinking cannot interrupt active lesson completion celebration
    expect(resolveMascotTransition('lesson_complete', 'thinking')).toBe('lesson_complete');
    expect(resolveMascotTransition('victory_dance', 'listening')).toBe('victory_dance');
    // Higher-priority event or explicit settle replaces previous state
    expect(resolveMascotTransition('thinking', 'correct_answer')).toBe('correct_answer');
    expect(resolveMascotTransition('greeting', 'idle')).toBe('idle');
    expect(
      resolveMascotTransition('victory_dance', 'thinking', { currentSettled: true }),
    ).toBe('thinking');
  });
});

describe('pickMascotPhrase', () => {
  it('is deterministic for the same seed', () => {
    const a = pickMascotPhrase(MASCOT_REACTIONS.correct_answer, 42);
    const b = pickMascotPhrase(MASCOT_REACTIONS.correct_answer, 42);
    expect(a).toBe(b);
  });

  it('normalizes negative and fractional seeds', () => {
    expect(pickMascotPhrase(MASCOT_REACTIONS.correct_answer, -3)).toBeTruthy();
    expect(pickMascotPhrase(MASCOT_REACTIONS.correct_answer, 2.9)).toBeTruthy();
  });

  it('cycles through distinct voice clips without back-to-back repeats', () => {
    const picker = createMascotVarietyPicker(() => 0.42);
    const seenPhrases = new Set<string>();
    const seenAudio = new Set<string>();
    let prevAudio: string | null = null;
    for (let i = 0; i < MASCOT_REACTIONS.correct_answer.audioKeys.length * 2; i += 1) {
      const pick = picker.pick('correct_answer');
      expect(pick.audioKey).not.toBe(prevAudio);
      prevAudio = pick.audioKey;
      seenPhrases.add(pick.phrase);
      seenAudio.add(pick.audioKey);
    }
    expect(seenPhrases.size).toBeGreaterThan(1);
    expect(seenAudio.size).toBe(MASCOT_REACTIONS.correct_answer.audioKeys.length);
    expect(pickMascotAudioKey(MASCOT_REACTIONS.incorrect_answer, 1)).toBe('incorrect-2');
  });

  it('persists unit_complete shuffle bags across picker instances so module endings vary', () => {
    let saved: string | null = null;
    const storage = {
      load: () => saved,
      save: (snapshot: string) => {
        saved = snapshot;
      },
    };
    const seen = new Set<string>();
    let prevAudio: string | null = null;
    for (let i = 0; i < MASCOT_REACTIONS.unit_complete.audioKeys.length; i += 1) {
      const freshPicker = createMascotVarietyPicker(() => 0.37, storage);
      const pick = freshPicker.pick('unit_complete');
      expect(pick.audioKey).not.toBe(prevAudio);
      prevAudio = pick.audioKey;
      seen.add(pick.audioKey);
    }
    expect(seen.size).toBe(MASCOT_REACTIONS.unit_complete.audioKeys.length);
  });
});
