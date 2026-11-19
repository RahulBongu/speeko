import { describe, expect, it } from 'vitest';
import { MASCOT_REACTIONS, mascotReaction, pickMascotPhrase } from './mascot.js';

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
});
