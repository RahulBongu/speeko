import { z } from 'zod';
import { isDue, newCard, review, SrsCardSchema, type SrsCard } from './srs.js';

/** Number of XP that counts as a completed daily goal. */
export const DAILY_GOAL = 50;

export const LessonRecordSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  completedAt: z.string().datetime(),
  accuracy: z.number().min(0).max(1),
  xp: z.number().int().min(0),
});

const DateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const ProgressStateSchema = z.object({
  version: z.literal(1),
  xp: z.number().int().min(0),
  streak: z.number().int().min(0),
  lastActiveDate: DateKeySchema.nullable(),
  todayDate: DateKeySchema,
  todayXp: z.number().int().min(0),
  completed: z.record(z.string(), LessonRecordSchema),
  lastCourseId: z.string().nullable(),
  lastLessonId: z.string().nullable(),
  srs: z.record(z.string(), SrsCardSchema).default({}),
});

export type LessonRecord = z.infer<typeof LessonRecordSchema>;
export type ProgressState = z.infer<typeof ProgressStateSchema>;

export interface CompletionInput {
  courseId: string;
  lessonId: string;
  xp: number;
  accuracy: number;
}

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function lessonKey(courseId: string, lessonId: string): string {
  return `${courseId}:${lessonId}`;
}

export function emptyProgress(now = new Date()): ProgressState {
  return {
    version: 1,
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    todayDate: todayKey(now),
    todayXp: 0,
    completed: {},
    lastCourseId: null,
    lastLessonId: null,
    srs: {},
  };
}

function newestCompletion(progress: ProgressState): string | null {
  let newest: string | null = null;
  for (const record of Object.values(progress.completed)) {
    if (!newest || record.completedAt > newest) newest = record.completedAt;
  }
  return newest;
}

/**
 * Merge two SRS card maps. For entries present in both, keep the card with
 * more repetitions (more evidence); ties broken by more lapses (learner
 * struggled → review sooner), then by earlier dueAt.
 */
function mergeSrs(a: Record<string, SrsCard>, b: Record<string, SrsCard>): Record<string, SrsCard> {
  const out: Record<string, SrsCard> = { ...a };
  for (const [key, card] of Object.entries(b)) {
    const existing = out[key];
    if (!existing) {
      out[key] = card;
      continue;
    }
    out[key] = pickReviewCard(existing, card);
  }
  return out;
}

function pickReviewCard(x: SrsCard, y: SrsCard): SrsCard {
  if (x.repetitions !== y.repetitions) return x.repetitions > y.repetitions ? x : y;
  if (x.lapses !== y.lapses) return x.lapses > y.lapses ? x : y;
  return x.dueAt <= y.dueAt ? x : y;
}

export interface SrsReview {
  skillId: string;
  quality: number;
}

/**
 * Applies an answered-exercise review set to a progress snapshot, creating
 * cards as needed and advancing each card's schedule (SM-2).
 */
export function applyReviews(
  progress: ProgressState,
  reviews: SrsReview[],
  now: number,
): ProgressState {
  if (reviews.length === 0) return progress;
  const srs = { ...progress.srs };
  for (const { skillId, quality } of reviews) {
    const card = srs[skillId] ?? newCard(skillId, now);
    srs[skillId] = review(card, quality, now);
  }
  return { ...progress, srs };
}

/** Returns the SRS cards due for review at `now`, earliest first. */
export function dueReviewCards(progress: ProgressState, now: number): SrsCard[] {
  return Object.values(progress.srs)
    .filter((card) => isDue(card, now))
    .sort((a, b) => a.dueAt - b.dueAt);
}

/**
 * Combines two progress snapshots without losing lessons or inflating XP.
 *
 * - Completed lessons are unioned; the more recent record wins.
 * - XP totals and daily XP take the higher value (snapshots may overlap).
 * - Streak and last position follow the snapshot with the most recent activity.
 */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const completed: Record<string, LessonRecord> = { ...a.completed };
  for (const [key, record] of Object.entries(b.completed)) {
    const existing = completed[key];
    if (
      !existing ||
      record.completedAt > existing.completedAt ||
      (record.completedAt === existing.completedAt && record.xp > existing.xp)
    ) {
      completed[key] = record;
    }
  }

  const aActive = a.lastActiveDate ?? '';
  const bActive = b.lastActiveDate ?? '';
  let newer: ProgressState;
  let older: ProgressState;
  if (aActive === bActive) {
    const aNewest = newestCompletion(a) ?? '';
    const bNewest = newestCompletion(b) ?? '';
    newer = bNewest >= aNewest ? b : a;
    older = newer === b ? a : b;
  } else if (bActive > aActive) {
    newer = b;
    older = a;
  } else {
    newer = a;
    older = b;
  }

  const todayDate = a.todayDate >= b.todayDate ? a.todayDate : b.todayDate;
  const todayXp =
    a.todayDate === b.todayDate
      ? Math.max(a.todayXp, b.todayXp)
      : a.todayDate > b.todayDate
        ? a.todayXp
        : b.todayXp;
  const srs = mergeSrs(a.srs, b.srs);

  const newestXp = Math.max(a.xp, b.xp);
  const streak = aActive === bActive ? Math.max(a.streak, b.streak) : newer.streak;
  const lastCourseId = newer.lastCourseId ?? older.lastCourseId;
  const lastLessonId = newer.lastLessonId ?? older.lastLessonId;

  return {
    version: 1,
    xp: newestXp,
    streak,
    lastActiveDate: newer.lastActiveDate ?? older.lastActiveDate,
    todayDate,
    todayXp,
    completed,
    lastCourseId,
    lastLessonId,
    srs,
  };
}

export function progressEquals(a: ProgressState, b: ProgressState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
