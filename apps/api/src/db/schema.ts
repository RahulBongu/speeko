import { pgTable, text, integer, timestamp, jsonb, boolean, serial, uniqueIndex } from 'drizzle-orm/pg-core';
import type { GradedAnswer, ProgressState } from '@speeko/core';
import { user } from './auth-schema.js';

export * from './auth-schema.js';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courses = pgTable(
  'courses',
  {
    id: text('id').primaryKey(),
    locale: text('locale').notNull(),
    sourceLocale: text('source_locale').notNull().default('en'),
    title: text('title').notNull(),
    difficulty: text('difficulty').notNull(),
    version: text('version').notNull().default('1.0.0'),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ localeIdx: uniqueIndex('courses_locale_id_idx').on(t.locale, t.id) }),
);

export const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  courseId: text('course_id').notNull(),
  locale: text('locale').notNull(),
  lessonId: text('lesson_id').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  xpEarned: integer('xp_earned').notNull().default(0),
  accuracy: integer('accuracy_bp').notNull().default(0), // basis points 0..10000
});

export const srsCards = pgTable('srs_cards', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  skillId: text('skill_id').notNull(),
  locale: text('locale').notNull(),
  ease: integer('ease_bp').notNull().default(250), // x100
  intervalDays: integer('interval_days').notNull().default(0),
  repetitions: integer('repetitions').notNull().default(0),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  lapses: integer('lapses').notNull().default(0),
});

export const streaks = pgTable('streaks', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  current: integer('current').notNull().default(0),
  longest: integer('longest').notNull().default(0),
  lastActiveDate: text('last_active_date'),
  freezeAvailable: boolean('freeze_available').notNull().default(false),
});

export const energy = pgTable('energy', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  amount: integer('amount').notNull().default(5),
  lastRegenAt: timestamp('last_regen_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Cloud copy of the learner's progress snapshot. The snapshot mirrors the
 * local store so guests can migrate to an account without losing anything.
 */
export const progressSnapshots = pgTable('progress_snapshots', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<ProgressState>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Append-only record of every verified lesson attempt. `attemptId` is the
 * client's idempotency key: a retry with the same key returns the original
 * event instead of awarding XP twice. Nothing updates or deletes these rows.
 */
export const lessonEvents = pgTable(
  'lesson_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    attemptId: text('attempt_id').notNull(),
    courseId: text('course_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    xpEarned: integer('xp_earned').notNull(),
    accuracyBp: integer('accuracy_bp').notNull(),
    heartsLeft: integer('hearts_left').notNull(),
    maxCombo: integer('max_combo').notNull(),
    answers: jsonb('answers').$type<GradedAnswer[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userAttemptIdx: uniqueIndex('lesson_events_user_attempt_idx').on(t.userId, t.attemptId),
  }),
);

/**
 * Append-only gem ledger. Positive amounts are earnings, negative amounts are
 * purchases. `sourceKey` is an idempotency key scoped to the user, so a retry
 * or a concurrent request can never credit or charge twice.
 */
export const gemLedger = pgTable(
  'gem_ledger',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: text('reason').notNull(),
    sourceKey: text('source_key').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userSourceIdx: uniqueIndex('gem_ledger_user_source_idx').on(t.userId, t.sourceKey),
  }),
);

/**
 * Owned shop items. Cosmetics are one-time purchases (quantity 1); consumables
 * such as streak freezes can have a quantity greater than one.
 */
/**
 * Public learner profile. One row per account; `username` is the follow target.
 */
export const userProfiles = pgTable(
  'user_profiles',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    username: text('username').notNull().unique(),
    displayName: text('display_name'),
    bio: text('bio'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
);

/**
 * Follow relationships. A row means `followerId` follows `followeeId`.
 */
export const follows = pgTable(
  'follows',
  {
    followerId: text('follower_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    followeeId: text('followee_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pairIdx: uniqueIndex('follows_pair_idx').on(t.followerId, t.followeeId),
  }),
);

/**
 * Owned shop items. Cosmetics are one-time purchases (quantity 1); consumables
 * such as streak freezes can have a quantity greater than one.
 */
export const userInventory = pgTable(
  'user_inventory',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    quantity: integer('quantity').notNull().default(1),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    userItemIdx: uniqueIndex('user_inventory_user_item_idx').on(t.userId, t.itemId),
  }),
);
