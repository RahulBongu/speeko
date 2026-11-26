import { describe, expect, it } from 'vitest';
import {
  MASCOT_REACTIONS,
  createMascotVarietyPicker,
  foxMoodForReaction,
  mascotReaction,
  pickMascotAudioKey,
  pickMascotPhrase,
  resolveFoxAnimation,
} from './mascot.js';

describe('MASCOT_REACTIONS', () => {
  it('has a reaction for every semantic event used by the apps', () => {
    expect(MASCOT_REACTIONS.correct_answer).toBeDefined();
    expect(MASCOT_REACTIONS.incorrect_answer).toBeDefined();
    expect(MASCOT_REACTIONS.lesson_complete).toBeDefined();
    expect(MASCOT_REACTIONS.discovery).toBeDefined();
    expect(MASCOT_REACTIONS.streak_milestone).toBeDefined();
    expect(MASCOT_REACTIONS.encouragement).toBeDefined();
  });

  it('assigns lesson completion the highest priority', () => {
    expect(mascotReaction('lesson_complete').priority).toBeGreaterThan(
      mascotReaction('correct_answer').priority,
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
    expect(foxMoodForReaction('discovery')).toBe('listening');
    expect(foxMoodForReaction('encouragement')).toBe('encouraging');
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
});
