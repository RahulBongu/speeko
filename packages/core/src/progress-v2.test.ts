import { describe, expect, it } from 'vitest';
import {
  DAILY_GOAL,
  PROGRESS_VERSION,
  ProgressSnapshotSchema,
  ProgressStateSchema,
  ProgressStateV1Schema,
  emptyProgress,
  mergeProgress,
  migrateProgress,
  todayKey,
  upgradeProgress,
} from './progress.js';

const NOW = new Date(2026, 10, 15, 12, 0);
const TODAY = todayKey(NOW);

/** A literal v1 payload exactly as older clients wrote it to localStorage. */
const v1Snapshot = {
  version: 1 as const,
  xp: 120,
  streak: 4,
  lastActiveDate: '2026-11-14',
  todayDate: TODAY,
  todayXp: 30,
  completed: {
    'hi-starter:hi-starter-u1-l1': {
      courseId: 'hi-starter',
      lessonId: 'hi-starter-u1-l1',
      completedAt: '2026-11-14T10:00:00.000Z',
      accuracy: 0.9,
      xp: 10,
    },
  },
  lastCourseId: 'hi-starter',
  lastLessonId: 'hi-starter-u1-l1',
  srs: {
    'hi:नमस्ते': {
      skillId: 'hi:नमस्ते',
      ease: 2.5,
      intervalDays: 1,
      repetitions: 1,
      dueAt: 1_763_200_000_000,
      lapses: 0,
    },
  },
};

describe('progress v2 migration', () => {
  it('creates an empty v2 snapshot with safe defaults', () => {
    const progress = emptyProgress(NOW);
    expect(progress.version).toBe(PROGRESS_VERSION);
    expect(progress.dailyGoal).toBe(DAILY_GOAL);
    expect(progress.timeZone).toBeNull();
  });

  it('upgrades a v1 snapshot without losing fields or mutating the input', () => {
    const before = JSON.stringify(v1Snapshot);
    const migrated = migrateProgress(v1Snapshot, NOW);

    expect(migrated.version).toBe(2);
    expect(migrated.xp).toBe(120);
    expect(migrated.streak).toBe(4);
    expect(migrated.lastActiveDate).toBe('2026-11-14');
    expect(migrated.todayDate).toBe(TODAY);
    expect(migrated.todayXp).toBe(30);
    expect(migrated.completed).toEqual(v1Snapshot.completed);
    expect(migrated.lastCourseId).toBe('hi-starter');
    expect(migrated.lastLessonId).toBe('hi-starter-u1-l1');
    expect(migrated.srs).toEqual({
      'hi:नमस्ते': {
        skillId: 'hi:नमस्ते',
        box: 1,
        dueAt: 1_763_200_000_000,
        lapses: 0,
      },
    });
    expect(migrated.dailyGoal).toBe(DAILY_GOAL);
    expect(migrated.timeZone).toBeNull();

    // v1 is read-only history: migration must not rewrite the old object.
    expect(JSON.stringify(v1Snapshot)).toBe(before);
  });

  it('keeps v1 parseable forever while the current schema targets v2', () => {
    expect(ProgressStateV1Schema.safeParse(v1Snapshot).success).toBe(true);
    expect(ProgressStateSchema.safeParse(v1Snapshot).success).toBe(false);
    expect(ProgressSnapshotSchema.safeParse(v1Snapshot).success).toBe(true);
  });

  it('accepts v2 and rejects unknown versions', () => {
    const v2 = migrateProgress(v1Snapshot, NOW);
    expect(ProgressStateSchema.safeParse(v2).success).toBe(true);
    expect(ProgressSnapshotSchema.safeParse(v2).success).toBe(true);
    expect(ProgressSnapshotSchema.safeParse({ ...v2, version: 3 }).success).toBe(false);
  });

  it('upgradeProgress defaults new fields for v1 and passes v2 through', () => {
    const upgraded = upgradeProgress(ProgressSnapshotSchema.parse(v1Snapshot));
    expect(upgraded.version).toBe(2);
    expect(upgraded.dailyGoal).toBe(DAILY_GOAL);
    expect(upgraded.timeZone).toBeNull();

    const v2 = migrateProgress(v1Snapshot, NOW);
    expect(upgradeProgress(v2)).toBe(v2);
  });

  it('maps legacy SM-2 intervals onto Leitner boxes without changing dueAt', () => {
    const dueAt = 1_763_200_000_000;
    const legacy = (intervalDays: number, repetitions: number, lapses = 0) => ({
      skillId: 'hi:card',
      ease: 2.5,
      intervalDays,
      repetitions,
      dueAt,
      lapses,
    });
    const migrated = migrateProgress(
      {
        ...v1Snapshot,
        srs: {
          'hi:new': { ...legacy(0, 0), skillId: 'hi:new' },
          'hi:tomorrow': { ...legacy(1, 1), skillId: 'hi:tomorrow' },
          'hi:two': { ...legacy(2, 2), skillId: 'hi:two' },
          'hi:four': { ...legacy(4, 3), skillId: 'hi:four' },
          'hi:eight': { ...legacy(8, 4), skillId: 'hi:eight' },
          'hi:sixteen': { ...legacy(16, 5), skillId: 'hi:sixteen' },
          'hi:missed': { ...legacy(1, 0, 2), skillId: 'hi:missed' },
        },
      },
      NOW,
    );

    expect(migrated.srs['hi:new']?.box).toBe(0);
    expect(migrated.srs['hi:tomorrow']?.box).toBe(1);
    expect(migrated.srs['hi:two']?.box).toBe(2);
    expect(migrated.srs['hi:four']?.box).toBe(3);
    expect(migrated.srs['hi:eight']?.box).toBe(4);
    expect(migrated.srs['hi:sixteen']?.box).toBe(5);
    expect(migrated.srs['hi:missed']?.box).toBe(1);
    expect(migrated.srs['hi:missed']?.lapses).toBe(2);
    expect(Object.values(migrated.srs).every((card) => card.dueAt === dueAt)).toBe(true);
  });

  it('is lenient with corrupt data and stale daily XP', () => {
    const migrated = migrateProgress(
      {
        version: 1,
        xp: -10,
        streak: Number.NaN,
        lastActiveDate: 'not-a-date',
        todayDate: '2026-11-01',
        todayXp: 99,
        completed: {
          good: v1Snapshot.completed['hi-starter:hi-starter-u1-l1'],
          bad: { courseId: 'hi-starter' },
        },
        lastCourseId: 42,
        lastLessonId: null,
        srs: {
          good: v1Snapshot.srs['hi:नमस्ते'],
          bad: { skillId: 'hi:broken' },
        },
        dailyGoal: 9000,
        timeZone: 42,
      },
      NOW,
    );

    expect(migrated.version).toBe(2);
    expect(migrated.xp).toBe(0);
    expect(migrated.streak).toBe(0);
    expect(migrated.lastActiveDate).toBeNull();
    expect(migrated.todayDate).toBe(TODAY);
    expect(migrated.todayXp).toBe(0);
    expect(Object.keys(migrated.completed)).toEqual(['good']);
    expect(Object.keys(migrated.srs)).toEqual(['good']);
    expect(migrated.lastCourseId).toBeNull();
    expect(migrated.dailyGoal).toBe(DAILY_GOAL);
    expect(migrated.timeZone).toBeNull();
  });

  it('returns an empty v2 for non-object input', () => {
    expect(migrateProgress('nope', NOW)).toEqual(emptyProgress(NOW));
    expect(migrateProgress(null, NOW)).toEqual(emptyProgress(NOW));
  });

  it('preserves valid v2 preferences', () => {
    const migrated = migrateProgress(
      { ...emptyProgress(NOW), dailyGoal: 80, timeZone: 'Asia/Kolkata' },
      NOW,
    );
    expect(migrated.dailyGoal).toBe(80);
    expect(migrated.timeZone).toBe('Asia/Kolkata');
  });

  it('keeps the newer preferences when merging v2 snapshots', () => {
    const older = {
      ...migrateProgress(v1Snapshot, NOW),
      dailyGoal: 30,
      timeZone: 'Asia/Kolkata',
      lastActiveDate: '2026-11-14',
    };
    const newer = {
      ...emptyProgress(NOW),
      dailyGoal: 80,
      timeZone: 'Europe/London',
      lastActiveDate: '2026-11-15',
      xp: 150,
    };

    const merged = mergeProgress(older, newer);
    expect(merged.dailyGoal).toBe(80);
    expect(merged.timeZone).toBe('Europe/London');
    expect(merged.xp).toBe(150);
  });

  it('merges a migrated v1 snapshot with a v2 snapshot', () => {
    const local = migrateProgress(v1Snapshot, NOW);
    const remote = {
      ...emptyProgress(NOW),
      xp: 200,
      lastActiveDate: '2026-11-15',
      completed: {
        'hi-starter:hi-starter-u1-l2': {
          courseId: 'hi-starter',
          lessonId: 'hi-starter-u1-l2',
          completedAt: '2026-11-15T09:00:00.000Z',
          accuracy: 1,
          xp: 12,
        },
      },
    };

    const merged = mergeProgress(local, remote);
    expect(merged.xp).toBe(200);
    expect(Object.keys(merged.completed).sort()).toEqual([
      'hi-starter:hi-starter-u1-l1',
      'hi-starter:hi-starter-u1-l2',
    ]);
  });
});
