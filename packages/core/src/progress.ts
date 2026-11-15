import { z } from 'zod';
import { isDue, newCard, review, SrsCardSchema, type SrsCard } from './srs.js';
import { updateStreak } from './gamification.js';

/** Number of XP that counts as a completed daily goal. */
export const DAILY_GOAL = 50;

/** Current snapshot version. v1 snapshots remain readable forever. */
export const PROGRESS_VERSION = 2;

export const LessonRecordSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  completedAt: z.string().datetime(),
  accuracy: z.number().min(0).max(1),
  xp: z.number().int().min(0),
});

const DateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const TimeZoneSchema = z.string().min(1).max(64);

/** Fields shared by every snapshot version. */
const progressFields = {
  xp: z.number().int().min(0),
  streak: z.number().int().min(0),
  lastActiveDate: DateKeySchema.nullable(),
  todayDate: DateKeySchema,
  todayXp: z.number().int().min(0),
  completed: z.record(z.string(), LessonRecordSchema),
  lastCourseId: z.string().nullable(),
  lastLessonId: z.string().nullable(),
  srs: z.record(z.string(), SrsCardSchema).default({}),
};

export const ProgressStateV1Schema = z.object({
  version: z.literal(1),
  ...progressFields,
});

export const ProgressStateV2Schema = z.object({
  version: z.literal(2),
  ...progressFields,
  /** Learner-settable daily XP goal (default 50 until the settings UI lands). */
  dailyGoal: z.number().int().min(1).max(1000).default(DAILY_GOAL),
  /** IANA timezone used for day boundaries; null until the client reports one. */
  timeZone: TimeZoneSchema.nullable().default(null),
});

/** Strict input schema for the API: accepts legacy v1 and current v2. */
export const ProgressSnapshotSchema = z.union([ProgressStateV1Schema, ProgressStateV2Schema]);

/** Current (v2) snapshot schema. v1 has its own schema above and is never mutated. */
export const ProgressStateSchema = ProgressStateV2Schema;

export type LessonRecord = z.infer<typeof LessonRecordSchema>;
export type ProgressStateV1 = z.infer<typeof ProgressStateV1Schema>;
export type ProgressState = z.infer<typeof ProgressStateV2Schema>;
export type ProgressSnapshot = z.infer<typeof ProgressSnapshotSchema>;

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
    version: PROGRESS_VERSION,
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    todayDate: todayKey(now),
    todayXp: 0,
    completed: {},
    lastCourseId: null,
    lastLessonId: null,
    srs: {},
    dailyGoal: DAILY_GOAL,
    timeZone: null,
  };
}

/** Strictly upgrades a schema-validated snapshot to the current version. */
export function upgradeProgress(snapshot: ProgressSnapshot): ProgressState {
  if (snapshot.version === PROGRESS_VERSION) return snapshot;
  return {
    ...snapshot,
    version: PROGRESS_VERSION,
    dailyGoal: DAILY_GOAL,
    timeZone: null,
  };
}

function nonNegativeInt(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function dateKeyOrNull(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function coerceCompleted(raw: unknown): Record<string, LessonRecord> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, LessonRecord> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = LessonRecordSchema.safeParse(value);
    if (parsed.success) out[key] = parsed.data;
  }
  return out;
}

function coerceSrs(raw: unknown): Record<string, SrsCard> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, SrsCard> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = SrsCardSchema.safeParse(value);
    if (parsed.success) out[key] = parsed.data;
  }
  return out;
}

/**
 * Reads any snapshot ever written — v1, current v2, or a partially corrupt
 * object — and returns a valid v2 state. v1 data is never rewritten in place;
 * callers decide where to persist the result.
 *
 * `todayDate` is always refreshed to the current local day so stale daily XP
 * cannot leak into a new day, matching the store's historical behaviour.
 */
export function migrateProgress(value: unknown, now = new Date()): ProgressState {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const today = todayKey(now);
  const sourceToday = dateKeyOrNull(source.todayDate);
  const dailyGoal =
    typeof source.dailyGoal === 'number' &&
    Number.isInteger(source.dailyGoal) &&
    source.dailyGoal >= 1 &&
    source.dailyGoal <= 1000
      ? source.dailyGoal
      : DAILY_GOAL;
  const timeZone =
    typeof source.timeZone === 'string' && source.timeZone.length > 0 && source.timeZone.length <= 64
      ? source.timeZone
      : null;

  return {
    version: PROGRESS_VERSION,
    xp: nonNegativeInt(source.xp),
    streak: nonNegativeInt(source.streak),
    lastActiveDate: dateKeyOrNull(source.lastActiveDate),
    todayDate: today,
    todayXp: sourceToday === today ? nonNegativeInt(source.todayXp) : 0,
    completed: coerceCompleted(source.completed),
    lastCourseId: typeof source.lastCourseId === 'string' ? source.lastCourseId : null,
    lastLessonId: typeof source.lastLessonId === 'string' ? source.lastLessonId : null,
    srs: coerceSrs(source.srs),
    dailyGoal,
    timeZone,
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
 * Records a finished lesson: XP, streak, daily XP, completion record, and the
 * learner's last position. Pure and shared by the web store and the API, so a
 * server-verified attempt updates progress with identical rules.
 */
export function recordCompletion(
  progress: ProgressState,
  input: CompletionInput,
  now = new Date(),
): ProgressState {
  const today = todayKey(now);
  const base: ProgressState =
    progress.todayDate === today ? progress : { ...progress, todayDate: today, todayXp: 0 };
  const key = lessonKey(input.courseId, input.lessonId);
  const previous = base.completed[key];
  const accuracy = Math.max(0, Math.min(1, input.accuracy));
  const record: LessonRecord = {
    courseId: input.courseId,
    lessonId: input.lessonId,
    completedAt: now.toISOString(),
    accuracy: Math.max(previous?.accuracy ?? 0, accuracy),
    xp: (previous?.xp ?? 0) + Math.max(0, input.xp),
  };
  const streak = updateStreak(base.lastActiveDate, today, base.streak, false);
  return {
    ...base,
    xp: base.xp + Math.max(0, input.xp),
    streak: streak.streak,
    lastActiveDate: today,
    todayXp: base.todayXp + Math.max(0, input.xp),
    completed: { ...base.completed, [key]: record },
    lastCourseId: input.courseId,
    lastLessonId: input.lessonId,
  };
}

/** Records a completion and applies its SRS outcomes in one step. */
export function recordCompletionAndReviews(
  progress: ProgressState,
  input: CompletionInput,
  reviews: SrsReview[],
  now = new Date(),
): ProgressState {
  const completed = recordCompletion(progress, input, now);
  return applyReviews(completed, reviews, now.getTime());
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
    version: PROGRESS_VERSION,
    xp: newestXp,
    streak,
    lastActiveDate: newer.lastActiveDate ?? older.lastActiveDate,
    todayDate,
    todayXp,
    completed,
    lastCourseId,
    lastLessonId,
    srs,
    dailyGoal: newer.dailyGoal,
    timeZone: newer.timeZone ?? older.timeZone,
  };
}

export function progressEquals(a: ProgressState, b: ProgressState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
