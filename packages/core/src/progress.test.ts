import { describe, expect, it } from 'vitest';
import {
  ProgressStateSchema,
  applyReviews,
  dueReviewCards,
  emptyProgress,
  mergeProgress,
  type ProgressState,
} from './progress.js';
import { newCard } from './srs.js';

function snapshot(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    ...emptyProgress(new Date(2026, 10, 15, 12, 0)),
    ...overrides,
  };
}

const record = (lessonId: string, completedAt: string, xp = 10) => ({
  courseId: 'hi-starter',
  lessonId,
  completedAt,
  accuracy: 1,
  xp,
});

const card = (skillId: string, overrides: Partial<ReturnType<typeof newCard>> = {}) => ({
  ...newCard(skillId, Date.UTC(2026, 10, 15)),
  ...overrides,
});

describe('progress', () => {
  it('creates an empty snapshot for the given day', () => {
    const progress = emptyProgress(new Date(2026, 10, 15, 23, 30));
    expect(progress.todayDate).toBe('2026-11-15');
    expect(progress.xp).toBe(0);
    expect(progress.completed).toEqual({});
  });

  it('unions completed lessons and keeps the newer record', () => {
    const a = snapshot({
      completed: { 'hi-starter:l1': record('l1', '2026-11-14T10:00:00.000Z', 5) },
      xp: 5,
    });
    const b = snapshot({
      completed: {
        'hi-starter:l1': record('l1', '2026-11-15T10:00:00.000Z', 12),
        'hi-starter:l2': record('l2', '2026-11-15T11:00:00.000Z', 10),
      },
      xp: 22,
    });
    const merged = mergeProgress(a, b);
    expect(Object.keys(merged.completed).sort()).toEqual(['hi-starter:l1', 'hi-starter:l2']);
    expect(merged.completed['hi-starter:l1']?.xp).toBe(12);
    expect(merged.xp).toBe(22);
  });

  it('takes the streak from the snapshot with newer activity', () => {
    const remote = snapshot({ streak: 9, lastActiveDate: '2026-11-13', xp: 100 });
    const local = snapshot({ streak: 2, lastActiveDate: '2026-11-15', xp: 20 });
    const merged = mergeProgress(remote, local);
    expect(merged.streak).toBe(2);
    expect(merged.lastActiveDate).toBe('2026-11-15');
    expect(merged.xp).toBe(100);
  });

  it('keeps daily XP from the most recent day without adding stale XP', () => {
    const remote = snapshot({ todayDate: '2026-11-14', todayXp: 50 });
    const local = snapshot({ todayDate: '2026-11-15', todayXp: 21 });
    expect(mergeProgress(remote, local).todayXp).toBe(21);
    expect(
      mergeProgress(
        snapshot({ todayDate: '2026-11-15', todayXp: 21 }),
        snapshot({ todayDate: '2026-11-15', todayXp: 30 }),
      ).todayXp,
    ).toBe(30);
  });

  it('takes the most recent course position', () => {
    const remote = snapshot({
      lastActiveDate: '2026-11-14',
      lastCourseId: 'hi-starter',
      lastLessonId: 'l1',
    });
    const local = snapshot({
      lastActiveDate: '2026-11-15',
      lastCourseId: 'ta-starter',
      lastLessonId: 'l2',
    });
    const merged = mergeProgress(remote, local);
    expect(merged.lastCourseId).toBe('ta-starter');
    expect(merged.lastLessonId).toBe('l2');
  });

  it('validates snapshots and rejects impossible values', () => {
    expect(ProgressStateSchema.safeParse(emptyProgress()).success).toBe(true);
    const bad = { ...emptyProgress(), xp: -5 };
    expect(ProgressStateSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts snapshots without srs (backwards compatibility)', () => {
    const base = emptyProgress();
    const { srs: _ignored, ...withoutSrs } = base;
    const parsed = ProgressStateSchema.parse(withoutSrs);
    expect(parsed.srs).toEqual({});
  });

  it('creates SRS cards for reviewed skills and advances their box', () => {
    const base = emptyProgress();
    const now = Date.UTC(2026, 10, 15, 12, 0);
    const next = applyReviews(base, [{ skillId: 'hi:नमस्ते', quality: 5 }], now);
    expect(next.srs['hi:नमस्ते']?.box).toBe(1);
    expect(next.srs['hi:नमस्ते']?.dueAt).toBe(now + 86_400_000);
    expect(next.srs['hi:नमस्ते']?.lapses).toBe(0);
  });

  it('counts failed reviews as lapses and returns the card to box 1', () => {
    const base = snapshot({ srs: { 'hi:नमस्ते': card('hi:नमस्ते', { box: 3 }) } });
    const now = Date.UTC(2026, 10, 15, 12, 0);
    const next = applyReviews(base, [{ skillId: 'hi:नमस्ते', quality: 2 }], now);
    expect(next.srs['hi:नमस्ते']?.box).toBe(1);
    expect(next.srs['hi:नमस्ते']?.lapses).toBe(1);
  });

  it('merges SRS cards from two snapshots', () => {
    const a = snapshot({ srs: { 'hi:x': card('hi:x', { box: 5, dueAt: Date.UTC(2026, 11, 1) }) } });
    const b = snapshot({ srs: { 'hi:x': card('hi:x', { box: 2, dueAt: Date.UTC(2026, 10, 20) }) } });
    const merged = mergeProgress(a, b);
    expect(merged.srs['hi:x']?.box).toBe(5);
  });

  it('dueReviewCards returns only due cards, earliest first', () => {
    const now = Date.UTC(2026, 10, 15, 12, 0);
    const progress = snapshot({
      srs: {
        'hi:earlier': card('hi:earlier', { dueAt: now - 1000, box: 3 }),
        'hi:later': card('hi:later', { dueAt: now - 500, box: 3 }),
        'hi:future': card('hi:future', { dueAt: now + 86_400_000 * 30, box: 5 }),
      },
    });
    const due = dueReviewCards(progress, now).map((c) => c.skillId);
    expect(due).toEqual(['hi:earlier', 'hi:later']);
  });
});
