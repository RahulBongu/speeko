import {
  buildHabitReport,
  dayKeyInTimeZone,
  historyFromActivity,
  type HabitReport,
  type ProgressState,
} from '@speeko/core';
import { API_URL } from './auth-client';

/**
 * Guest habit report. It is derived from this device's saved activity only;
 * the page labels it as device data rather than server-verified history.
 */
export function guestHabitReport(progress: ProgressState, now = new Date()): HabitReport {
  return buildHabitReport(historyFromActivity(progress.activity), {
    asOfDay: dayKeyInTimeZone(now, progress.timeZone),
    timeZone: progress.timeZone,
    dailyGoal: progress.dailyGoal,
    lifetimeXp: progress.xp,
    lifetimeLessons: Object.keys(progress.completed).length,
  });
}

/** Fetches the signed-in learner's event-derived habit report. */
export async function fetchHabits(): Promise<HabitReport | null> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/habits`, { credentials: 'include' });
  } catch {
    throw new Error('Could not reach Speeko.');
  }
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Habits could not load (status ${response.status}).`);
  }
  const body = (await response.json()) as { habits?: HabitReport };
  if (!body.habits) throw new Error('Habits response was empty.');
  return body.habits;
}
