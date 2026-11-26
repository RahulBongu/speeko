import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildCalendar,
  buildHabitReport,
  computeAchievements,
  computeQuests,
  computeStreak,
  dayKeyInTimeZone,
  diffDays,
  historyFromActivity,
  historyFromLessonEvents,
  isValidTimeZone,
  normalizeHistory,
  weekStart,
  type HabitDay,
} from './habits.js';

function days(start: string, count: number, xp = 10): HabitDay[] {
  return Array.from({ length: count }, (_, index) => ({
    day: addDays(start, index),
    xp,
    lessons: 1,
  }));
}

describe('time-zone day keys', () => {
  it('rolls the day at midnight in Asia/Kolkata', () => {
    expect(dayKeyInTimeZone(new Date('2026-11-15T18:29:59Z'), 'Asia/Kolkata')).toBe('2026-11-15');
    expect(dayKeyInTimeZone(new Date('2026-11-15T18:30:00Z'), 'Asia/Kolkata')).toBe('2026-11-16');
  });

  it('survives the New York spring-forward DST change', () => {
    expect(dayKeyInTimeZone(new Date('2026-03-08T06:30:00Z'), 'America/New_York')).toBe('2026-03-08');
    expect(dayKeyInTimeZone(new Date('2026-03-09T03:30:00Z'), 'America/New_York')).toBe('2026-03-08');
    expect(dayKeyInTimeZone(new Date('2026-03-09T04:30:00Z'), 'America/New_York')).toBe('2026-03-09');
  });

  it('survives the New York fall-back DST change', () => {
    expect(dayKeyInTimeZone(new Date('2026-11-01T05:30:00Z'), 'America/New_York')).toBe('2026-11-01');
    expect(dayKeyInTimeZone(new Date('2026-11-01T06:30:00Z'), 'America/New_York')).toBe('2026-11-01');
    expect(dayKeyInTimeZone(new Date('2026-11-02T04:30:00Z'), 'America/New_York')).toBe('2026-11-01');
    expect(dayKeyInTimeZone(new Date('2026-11-02T05:30:00Z'), 'America/New_York')).toBe('2026-11-02');
  });

  it('validates zones and does date-only arithmetic across DST', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(diffDays('2026-03-07', '2026-03-09')).toBe(2);
    expect(diffDays('2026-11-01', '2026-11-02')).toBe(1);
    expect(weekStart('2026-11-18')).toBe('2026-11-16');
    expect(weekStart('2026-11-16')).toBe('2026-11-16');
  });
});

describe('event history', () => {
  it('buckets events by local day and ignores duplicate attempt ids', () => {
    const events = [
      { attemptId: 'a', createdAt: '2026-11-15T18:29:00Z', xp: 10 },
      { attemptId: 'a', createdAt: '2026-11-15T18:29:00Z', xp: 10 },
      { attemptId: 'b', createdAt: '2026-11-15T18:30:00Z', xp: 12 },
      { attemptId: 'c', createdAt: '2026-11-16T04:00:00Z', xp: 8 },
    ];
    const history = historyFromLessonEvents(events, 'Asia/Kolkata');
    expect(history).toEqual([
      { day: '2026-11-15', xp: 10, lessons: 1 },
      { day: '2026-11-16', xp: 20, lessons: 2 },
    ]);
  });

  it('never double-counts a duplicated day row in a history list', () => {
    const history = normalizeHistory([
      { day: '2026-11-15', xp: 10, lessons: 1 },
      { day: '2026-11-15', xp: 10, lessons: 1 },
    ]);
    expect(history).toEqual([{ day: '2026-11-15', xp: 10, lessons: 1 }]);
    expect(computeQuests(history, '2026-11-15', 50)[0]?.progress).toBe(10);
  });

  it('converts snapshot activity without trusting invalid rows', () => {
    expect(
      historyFromActivity({
        '2026-11-15': { xp: 12, lessons: 1 },
        'not-a-day': { xp: 99, lessons: 9 },
      }),
    ).toEqual([{ day: '2026-11-15', xp: 12, lessons: 1 }]);
  });
});

describe('streaks and freezes', () => {
  it('counts consecutive days and keeps a streak alive through yesterday', () => {
    const history = days('2026-11-01', 3);
    expect(computeStreak(history, '2026-11-03').current).toBe(3);
    expect(computeStreak(history, '2026-11-04').current).toBe(3);
    expect(computeStreak(history, '2026-11-05').current).toBe(0);
    expect(computeStreak(history, '2026-11-05').longest).toBe(3);
  });

  it('earns a freeze at seven days and spends it on a one-day gap', () => {
    const history = [...days('2026-11-01', 7), { day: '2026-11-09', xp: 10, lessons: 1 }];
    const streak = computeStreak(history, '2026-11-09');
    expect(streak.current).toBe(8);
    expect(streak.freezesAvailable).toBe(0);
    expect(streak.frozenDays).toEqual(['2026-11-08']);
  });

  it('uses a freeze for a trailing missed day but not for two missed days', () => {
    const history = days('2026-11-01', 7);
    const oneMissed = computeStreak(history, '2026-11-09');
    expect(oneMissed.current).toBe(7);
    expect(oneMissed.freezesAvailable).toBe(0);
    expect(oneMissed.frozenDays).toEqual(['2026-11-08']);

    const twoMissed = computeStreak(history, '2026-11-10');
    expect(twoMissed.current).toBe(0);
  });

  it('resets after a gap longer than the freeze can cover', () => {
    const history = [...days('2026-11-01', 7), { day: '2026-11-11', xp: 10, lessons: 1 }];
    const streak = computeStreak(history, '2026-11-11');
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(7);
  });

  it('caps the freeze inventory at two', () => {
    const history = days('2026-11-01', 21);
    const streak = computeStreak(history, '2026-11-21');
    expect(streak.current).toBe(21);
    expect(streak.freezesAvailable).toBe(2);
    expect(streak.maxFreezes).toBe(2);
  });

  it('uses purchased shop freezes to protect a trailing missed day and reflects them in the calendar', () => {
    const history = days('2026-11-01', 3);
    const protectedStreak = computeStreak(history, '2026-11-05', 1);
    expect(protectedStreak.current).toBe(3);
    expect(protectedStreak.freezesAvailable).toBe(0);
    expect(protectedStreak.frozenDays).toEqual(['2026-11-04']);

    const report = buildHabitReport(history, {
      asOfDay: '2026-11-05',
      timeZone: 'Asia/Kolkata',
      purchasedFreezes: 2,
    });
    expect(report.streak.current).toBe(3);
    expect(report.streak.freezesAvailable).toBe(1);
    expect(report.calendar.find((day) => day.day === '2026-11-04')?.status).toBe('frozen');
  });
});

describe('quests, calendar, and achievements', () => {
  const history: HabitDay[] = [
    { day: '2026-11-16', xp: 30, lessons: 1 },
    { day: '2026-11-17', xp: 20, lessons: 1 },
    { day: '2026-11-18', xp: 10, lessons: 1 },
  ];

  it('derives daily and weekly quest progress from history', () => {
    const quests = computeQuests(history, '2026-11-18', 50);
    expect(quests.map((quest) => [quest.id, quest.progress, quest.target, quest.complete])).toEqual([
      ['daily-goal', 10, 50, false],
      ['daily-lessons', 1, 2, false],
      ['weekly-lessons', 3, 5, false],
    ]);
  });

  it('can keep practice activity out of quest progress', () => {
    const activity: HabitDay[] = [{ day: '2026-11-18', xp: 0, lessons: 3 }];
    const rewards: HabitDay[] = [{ day: '2026-11-18', xp: 21, lessons: 1 }];
    const report = buildHabitReport(activity, {
      asOfDay: '2026-11-18',
      timeZone: 'Asia/Kolkata',
      dailyGoal: 50,
      questHistory: rewards,
    });
    expect(report.today).toMatchObject({ xp: 0, lessons: 3 });
    expect(report.streak.current).toBe(1);
    expect(report.quests.map((quest) => quest.progress)).toEqual([21, 1, 1]);
  });

  it('keeps weekly quests on a Monday boundary', () => {
    const before = computeQuests(
      [{ day: '2026-11-15', xp: 50, lessons: 2 }],
      '2026-11-15',
      50,
    );
    expect(before[2]?.progress).toBe(2);
    const after = computeQuests(
      [
        { day: '2026-11-15', xp: 50, lessons: 2 },
        { day: '2026-11-16', xp: 50, lessons: 1 },
      ],
      '2026-11-16',
      50,
    );
    expect(after[2]?.progress).toBe(1);
  });

  it('builds a 12-week Monday-aligned calendar and marks frozen days', () => {
    const calendar = buildCalendar(history, '2026-11-18', 50, ['2026-11-17']);
    expect(calendar).toHaveLength(84);
    expect(calendar[0]?.day).toBe('2026-08-31');
    expect(calendar.at(-1)?.day).toBe('2026-11-22');
    expect(calendar.filter((day) => day.status === 'future')).toHaveLength(4);
    const frozen = calendar.find((day) => day.day === '2026-11-17');
    expect(frozen?.status).toBe('frozen');
    expect(frozen?.intensity).toBe(0);
    const today = calendar.find((day) => day.day === '2026-11-18');
    expect(today?.status).toBe('active');
    expect(today?.intensity).toBe(1);
  });

  it('unlocks achievements only from real totals', () => {
    const streak = computeStreak(history, '2026-11-18');
    const { achievements, totals } = computeAchievements(history, streak, 150, 4);
    expect(totals).toEqual({ xp: 150, lessons: 4, activeDays: 3 });
    expect(achievements.find((item) => item.id === 'first-lesson')?.complete).toBe(true);
    expect(achievements.find((item) => item.id === 'xp-100')?.complete).toBe(true);
    expect(achievements.find((item) => item.id === 'ten-lessons')?.complete).toBe(false);
    expect(achievements.find((item) => item.id === 'ten-lessons')?.progress).toBe(4);
  });

  it('returns one honest report for an empty learner', () => {
    const report = buildHabitReport([], {
      asOfDay: '2026-11-18',
      timeZone: 'Asia/Kolkata',
      dailyGoal: 50,
    });
    expect(report.today).toEqual({
      day: '2026-11-18',
      xp: 0,
      lessons: 0,
      goalMet: false,
      goalRemaining: 50,
    });
    expect(report.streak.current).toBe(0);
    expect(report.quests.every((quest) => quest.progress === 0)).toBe(true);
    expect(report.achievements.every((item) => !item.complete)).toBe(true);
    expect(report.totals).toEqual({ xp: 0, lessons: 0, activeDays: 0 });
  });
});
