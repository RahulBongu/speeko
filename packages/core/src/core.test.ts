import { describe, it, expect } from 'vitest';
import {
  levelForXp,
  xpForLevel,
  updateStreak,
  regenEnergy,
  nextLeague,
  xpForExercise,
  review,
  newCard,
  isDue,
  createSession,
  reduceSession,
  currentExercise,
  accuracy,
  toNativeDigits,
  isIndianLocale,
  validateCourse,
} from './index.js';

describe('gamification', () => {
  it('level curve is monotonic', () => {
    let prev = 0;
    for (let l = 1; l <= 20; l++) {
      const x = xpForLevel(l);
      expect(x).toBeGreaterThanOrEqual(prev);
      prev = x;
    }
  });
  it('levelForXp round-trips', () => {
    for (const l of [1, 2, 5, 10, 25]) {
      const xp = xpForLevel(l);
      expect(levelForXp(xp)).toBe(l);
    }
  });
  it('streak increments on consecutive days', () => {
    expect(updateStreak('2026-01-01', '2026-01-02', 3, false)).toEqual({ streak: 4, freezeUsed: false });
  });
  it('streak resets after a gap', () => {
    expect(updateStreak('2026-01-01', '2026-01-04', 3, false)).toEqual({ streak: 1, freezeUsed: false });
  });
  it('freeze saves a one-day gap', () => {
    expect(updateStreak('2026-01-01', '2026-01-03', 3, true)).toEqual({ streak: 4, freezeUsed: true });
  });
  it('energy regen caps at max', () => {
    const r = regenEnergy(2, 0, 10 * 25 * 60_000);
    expect(r.energy).toBe(5);
  });
  it('league promotion order', () => {
    expect(nextLeague('bronze')).toBe('silver');
    expect(nextLeague('champion')).toBeNull();
  });
  it('xp per exercise', () => {
    expect(xpForExercise('speak')).toBe(5);
    expect(xpForExercise('unknown')).toBe(1);
  });
});

describe('srs', () => {
  it('new card is due now', () => {
    const c = newCard('skill-1', 1000);
    expect(isDue(c, 1000)).toBe(true);
  });
  it('failed review resets interval', () => {
    const c = newCard('skill-1', 0);
    const r = review(c, 1, 0);
    expect(r.intervalDays).toBe(1);
    expect(r.lapses).toBe(1);
    expect(r.repetitions).toBe(0);
  });
  it('perfect review grows interval', () => {
    let c = newCard('skill-1', 0);
    c = review(c, 5, 0);
    c = review(c, 5, 86_400_000);
    expect(c.intervalDays).toBeGreaterThanOrEqual(6);
  });
});

describe('session', () => {
  it('tracks answers, xp, hearts, combo', () => {
    const ex = [
      { id: 'e1', kind: 'chooseMeaning', prompt: 'hi' },
      { id: 'e2', kind: 'chooseMeaning', prompt: 'bye' },
    ] as any;
    let s = createSession('l1', ex, 0, 5);
    s = reduceSession(s, { type: 'answer', exerciseId: 'e1', correct: true, ms: 1000 });
    expect(s.xp).toBe(2);
    expect(s.combo).toBe(1);
    expect(s.hearts).toBe(5);
    s = reduceSession(s, { type: 'answer', exerciseId: 'e2', correct: false, ms: 1000 });
    expect(s.hearts).toBe(4);
    expect(s.combo).toBe(0);
    expect(s.mistakes).toEqual(['e2']);
    expect(accuracy(s)).toBe(0.5);
  });
  it('currentExercise advances', () => {
    const ex = [{ id: 'e1', kind: 'chooseMeaning', prompt: 'hi' }] as any;
    let s = createSession('l1', ex, 0, 5);
    expect(currentExercise(s)?.id).toBe('e1');
    s = reduceSession(s, { type: 'answer', exerciseId: 'e1', correct: true, ms: 500 });
    expect(currentExercise(s)).toBeNull();
  });
});

describe('locale', () => {
  it('native digits for hindi', () => {
    expect(toNativeDigits(42, 'hi')).toBe('४२');
  });
  it('indian locale detection', () => {
    expect(isIndianLocale('hi')).toBe(true);
    expect(isIndianLocale('en')).toBe(false);
  });
});

describe('content', () => {
  it('validates a minimal course', () => {
    const course = {
      id: 'hi-a1',
      locale: 'hi',
      title: 'Hindi A1',
      difficulty: 'A1' as const,
      units: [
        {
          id: 'u1',
          title: 'Basics',
          order: 0,
          lessons: [
            {
              id: 'l1',
              title: 'Greetings',
              order: 0,
              difficulty: 'A1' as const,
              exercises: [
                { id: 'e1', kind: 'chooseMeaning', prompt: 'Hello', options: ['नमस्ते', 'अलविदा'], answerIndex: 0 },
              ],
            },
          ],
        },
      ],
    };
    const parsed = validateCourse(course);
    expect(parsed.locale).toBe('hi');
    expect(parsed.units[0]!.lessons[0]!.exercises[0]!.kind).toBe('chooseMeaning');
  });
});
