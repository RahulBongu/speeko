import { describe, expect, it } from 'vitest';
import {
  ProgressStateSchema,
  emptyProgress,
  mergeProgress,
  type ProgressState,
} from './progress.js';

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
});
