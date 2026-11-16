import {
  DAILY_GOAL_DEFAULT,
  HABIT_ACHIEVEMENTS,
  HABIT_CALENDAR_WEEKS,
  HABIT_QUESTS,
  MAX_STREAK_FREEZES,
  STREAK_FREEZE_EARN_INTERVAL,
  type AchievementMetric,
  type AchievementDefinition,
  type QuestDefinition,
} from './config.js';

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

/** One calendar day of verified (or device-local) activity. */
export interface HabitDay {
  day: string;
  xp: number;
  lessons: number;
}

export interface ActivityDay {
  xp: number;
  lessons: number;
}

export interface LessonEventLike {
  attemptId: string;
  createdAt: Date | string;
  xp: number;
}

export interface StreakSummary {
  current: number;
  longest: number;
  freezesAvailable: number;
  maxFreezes: number;
  /** Missed days covered by a freeze, oldest first. */
  frozenDays: string[];
}

export type QuestProgress = {
  id: string;
  title: string;
  metric: QuestDefinition['metric'];
  period: QuestDefinition['period'];
  target: number;
  progress: number;
  complete: boolean;
};

export type AchievementProgress = {
  id: string;
  title: string;
  metric: AchievementMetric;
  target: number;
  progress: number;
  complete: boolean;
};

export type CalendarStatus = 'active' | 'frozen' | 'empty' | 'future';

export interface CalendarDay {
  day: string;
  xp: number;
  lessons: number;
  status: CalendarStatus;
  /** 0 = nothing, 1–3 = partial goal, 4 = goal met. */
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface HabitReport {
  asOfDay: string;
  timeZone: string | null;
  dailyGoal: number;
  today: {
    day: string;
    xp: number;
    lessons: number;
    goalMet: boolean;
    goalRemaining: number;
  };
  streak: StreakSummary;
  quests: QuestProgress[];
  calendar: CalendarDay[];
  achievements: AchievementProgress[];
  totals: {
    xp: number;
    lessons: number;
    activeDays: number;
  };
}

export interface HabitReportOptions {
  asOfDay: string;
  timeZone: string | null;
  dailyGoal?: number;
  /** Totals from a legacy snapshot, used only when history cannot supply them. */
  lifetimeXp?: number;
  lifetimeLessons?: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat | null>();

function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
  if (formatterCache.has(timeZone)) return formatterCache.get(timeZone) ?? null;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    formatterCache.set(timeZone, formatter);
    return formatter;
  } catch {
    formatterCache.set(timeZone, null);
    return null;
  }
}

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  return typeof timeZone === 'string' && timeZone.length > 0 && formatterFor(timeZone) !== null;
}

/** The browser's IANA zone, or null when Intl cannot report one. */
export function browserTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(timeZone) ? timeZone : null;
  } catch {
    return null;
  }
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * Calendar day in the learner's IANA time zone. Invalid/missing zones fall
 * back to the runtime's local day so guest mode keeps working offline.
 */
export function dayKeyInTimeZone(date: Date, timeZone?: string | null): string {
  if (!timeZone) return localDayKey(date);
  const formatter = formatterFor(timeZone);
  if (!formatter) return localDayKey(date);
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) return localDayKey(date);
  return `${year}-${month}-${day}`;
}

export function isDayKey(value: string): boolean {
  if (!DAY_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Calendar arithmetic on day keys. DST cannot change a date-only key. */
export function addDays(day: string, amount: number): string {
  if (!isDayKey(day)) throw new Error(`Invalid day key: ${day}`);
  const [year, month, date] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: string, to: string): number {
  if (!isDayKey(from) || !isDayKey(to)) throw new Error('Invalid day key');
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / MS_PER_DAY);
}

/** Monday of the week containing `day`. */
export function weekStart(day: string): string {
  if (!isDayKey(day)) throw new Error(`Invalid day key: ${day}`);
  const weekDay = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((weekDay + 6) % 7));
}

function nonNegativeInt(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

/**
 * Normalises a history list. Rows are day aggregates; duplicate days keep the
 * larger values so feeding the same day twice can never double-count.
 */
export function normalizeHistory(history: readonly HabitDay[]): HabitDay[] {
  const byDay = new Map<string, HabitDay>();
  for (const row of history) {
    if (!row || !isDayKey(row.day)) continue;
    const xp = nonNegativeInt(row.xp);
    const lessons = nonNegativeInt(row.lessons);
    const existing = byDay.get(row.day);
    if (!existing) {
      byDay.set(row.day, { day: row.day, xp, lessons });
    } else {
      existing.xp = Math.max(existing.xp, xp);
      existing.lessons = Math.max(existing.lessons, lessons);
    }
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/** Converts the snapshot's local activity map into a history list. */
export function historyFromActivity(
  activity: Record<string, ActivityDay> | null | undefined,
): HabitDay[] {
  if (!activity || typeof activity !== 'object') return [];
  return normalizeHistory(
    Object.entries(activity).map(([day, value]) => ({
      day,
      xp: nonNegativeInt(value?.xp),
      lessons: nonNegativeInt(value?.lessons),
    })),
  );
}

/**
 * Buckets verified lesson events by the learner's local day. Duplicate
 * `attemptId` rows are ignored, so retries can never inflate a day or quest.
 */
export function historyFromLessonEvents(
  events: readonly LessonEventLike[],
  timeZone?: string | null,
): HabitDay[] {
  const seen = new Set<string>();
  const byDay = new Map<string, HabitDay>();
  for (const event of events) {
    if (!event || !event.attemptId || seen.has(event.attemptId)) continue;
    seen.add(event.attemptId);
    const date = event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const day = dayKeyInTimeZone(date, timeZone);
    const existing = byDay.get(day) ?? { day, xp: 0, lessons: 0 };
    existing.xp += nonNegativeInt(event.xp);
    existing.lessons += 1;
    byDay.set(day, existing);
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function isActive(day: HabitDay): boolean {
  return day.xp > 0 || day.lessons > 0;
}

/**
 * Simulates the streak from activity days.
 *
 * - Consecutive days extend the streak.
 * - A one-day gap consumes a freeze when one is held.
 * - Larger gaps reset the run.
 * - One freeze is earned at every 7th day, capped at two.
 * - A trailing one-day gap uses a freeze for display; a longer gap means the
 *   streak is already broken.
 */
export function computeStreak(
  history: readonly HabitDay[],
  asOfDay: string,
): StreakSummary {
  if (!isDayKey(asOfDay)) throw new Error(`Invalid day key: ${asOfDay}`);
  const days = normalizeHistory(history).filter((day) => day.day <= asOfDay && isActive(day));

  let streak = 0;
  let longest = 0;
  let freezes = 0;
  let nextFreezeAt = STREAK_FREEZE_EARN_INTERVAL;
  const frozenDays: string[] = [];
  let previous: string | null = null;

  for (const entry of days) {
    if (previous === null) {
      streak = 1;
    } else {
      const gap = diffDays(previous, entry.day);
      if (gap === 1) {
        streak += 1;
      } else if (gap === 2 && freezes > 0) {
        freezes -= 1;
        frozenDays.push(addDays(previous, 1));
        streak += 1;
      } else {
        streak = 1;
        nextFreezeAt = STREAK_FREEZE_EARN_INTERVAL;
      }
    }

    longest = Math.max(longest, streak);
    while (streak >= nextFreezeAt) {
      if (freezes < MAX_STREAK_FREEZES) freezes += 1;
      nextFreezeAt += STREAK_FREEZE_EARN_INTERVAL;
    }
    previous = entry.day;
  }

  let current = streak;
  if (previous) {
    const gap = diffDays(previous, asOfDay);
    if (gap >= 3) {
      current = 0;
    } else if (gap === 2) {
      if (freezes > 0) {
        freezes -= 1;
        frozenDays.push(addDays(previous, 1));
      } else {
        current = 0;
      }
    }
  } else {
    current = 0;
  }

  return {
    current,
    longest,
    freezesAvailable: freezes,
    maxFreezes: MAX_STREAK_FREEZES,
    frozenDays: [...new Set(frozenDays)].sort(),
  };
}

function targetFor(definition: QuestDefinition, dailyGoal: number): number {
  return definition.target === 'dailyGoal' ? dailyGoal : definition.target;
}

export function computeQuests(
  history: readonly HabitDay[],
  asOfDay: string,
  dailyGoal = DAILY_GOAL_DEFAULT,
): QuestProgress[] {
  const days = normalizeHistory(history).filter((day) => day.day <= asOfDay);
  const today = days.find((day) => day.day === asOfDay);
  const start = weekStart(asOfDay);
  const weekLessons = days
    .filter((day) => day.day >= start && day.day <= asOfDay)
    .reduce((sum, day) => sum + day.lessons, 0);

  return HABIT_QUESTS.map((definition) => {
    const target = Math.max(1, targetFor(definition, dailyGoal));
    const value =
      definition.metric === 'todayXp'
        ? (today?.xp ?? 0)
        : definition.metric === 'todayLessons'
          ? (today?.lessons ?? 0)
          : weekLessons;
    const progress = Math.min(target, Math.max(0, value));
    return {
      id: definition.id,
      title: definition.title,
      metric: definition.metric,
      period: definition.period,
      target,
      progress,
      complete: progress >= target,
    };
  });
}

function intensityFor(xp: number, dailyGoal: number): CalendarDay['intensity'] {
  if (xp <= 0) return 0;
  const goal = Math.max(1, dailyGoal);
  if (xp >= goal) return 4;
  const ratio = xp / goal;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

/** Monday-aligned calendar ending with the current week. */
export function buildCalendar(
  history: readonly HabitDay[],
  asOfDay: string,
  dailyGoal: number,
  frozenDays: readonly string[] = [],
): CalendarDay[] {
  if (!isDayKey(asOfDay)) throw new Error(`Invalid day key: ${asOfDay}`);
  const byDay = new Map(normalizeHistory(history).map((day) => [day.day, day]));
  const frozen = new Set(frozenDays);
  const start = addDays(weekStart(asOfDay), -7 * (HABIT_CALENDAR_WEEKS - 1));
  const total = HABIT_CALENDAR_WEEKS * 7;
  const days: CalendarDay[] = [];

  for (let index = 0; index < total; index += 1) {
    const day = addDays(start, index);
    const entry = byDay.get(day);
    const xp = entry?.xp ?? 0;
    const lessons = entry?.lessons ?? 0;
    let status: CalendarStatus;
    if (day > asOfDay) status = 'future';
    else if (frozen.has(day)) status = 'frozen';
    else if (xp > 0 || lessons > 0) status = 'active';
    else status = 'empty';
    days.push({
      day,
      xp,
      lessons,
      status,
      intensity: status === 'active' ? intensityFor(xp, dailyGoal) : 0,
    });
  }
  return days;
}

function achievementValue(
  metric: AchievementMetric,
  totals: { xp: number; lessons: number; activeDays: number },
  streak: StreakSummary,
): number {
  switch (metric) {
    case 'lessons':
      return totals.lessons;
    case 'xp':
      return totals.xp;
    case 'activeDays':
      return totals.activeDays;
    case 'bestStreak':
      return streak.longest;
  }
}

export function computeAchievements(
  history: readonly HabitDay[],
  streak: StreakSummary,
  lifetimeXp: number,
  lifetimeLessons: number,
): { achievements: AchievementProgress[]; totals: HabitReport['totals'] } {
  const days = normalizeHistory(history);
  const totals = {
    xp: Math.max(nonNegativeInt(lifetimeXp), days.reduce((sum, day) => sum + day.xp, 0)),
    lessons: Math.max(
      nonNegativeInt(lifetimeLessons),
      days.reduce((sum, day) => sum + day.lessons, 0),
    ),
    activeDays: days.filter(isActive).length,
  };

  const achievements = HABIT_ACHIEVEMENTS.map((definition: AchievementDefinition) => {
    const value = achievementValue(definition.metric, totals, streak);
    const progress = Math.min(definition.target, Math.max(0, value));
    return {
      id: definition.id,
      title: definition.title,
      metric: definition.metric,
      target: definition.target,
      progress,
      complete: progress >= definition.target,
    };
  });

  return { achievements, totals };
}

/** One pure report shared by the API, the habits page, and tests. */
export function buildHabitReport(
  history: readonly HabitDay[],
  options: HabitReportOptions,
): HabitReport {
  const asOfDay = options.asOfDay;
  if (!isDayKey(asOfDay)) throw new Error(`Invalid day key: ${asOfDay}`);
  const dailyGoal = Math.max(1, Math.floor(options.dailyGoal ?? DAILY_GOAL_DEFAULT));
  const days = normalizeHistory(history).filter((day) => day.day <= asOfDay);
  const streak = computeStreak(days, asOfDay);
  const todayEntry = days.find((day) => day.day === asOfDay);
  const todayXp = todayEntry?.xp ?? 0;
  const { achievements, totals } = computeAchievements(
    days,
    streak,
    options.lifetimeXp ?? 0,
    options.lifetimeLessons ?? 0,
  );

  return {
    asOfDay,
    timeZone: options.timeZone,
    dailyGoal,
    today: {
      day: asOfDay,
      xp: todayXp,
      lessons: todayEntry?.lessons ?? 0,
      goalMet: todayXp >= dailyGoal,
      goalRemaining: Math.max(0, dailyGoal - todayXp),
    },
    streak,
    quests: computeQuests(days, asOfDay, dailyGoal),
    calendar: buildCalendar(days, asOfDay, dailyGoal, streak.frozenDays),
    achievements,
    totals,
  };
}
