// Single source of truth for tunable game and habit numbers.
// Pure data only: no I/O, no UI copy. Labels live in the clients.

/** Default daily XP goal. */
export const DAILY_GOAL_DEFAULT = 50;

/** Goals offered by onboarding and the habits goal picker. */
export const DAILY_GOAL_OPTIONS = [10, 30, 50, 80, 120] as const;

/** A streak freeze is earned at every multiple of this streak length. */
export const STREAK_FREEZE_EARN_INTERVAL = 7;

/** Maximum freezes a learner can hold. */
export const MAX_STREAK_FREEZES = 2;

/** Calendar shows this many Monday-aligned weeks, including the current one. */
export const HABIT_CALENDAR_WEEKS = 12;

export type QuestMetric = 'todayXp' | 'todayLessons' | 'weekLessons';
export type QuestPeriod = 'day' | 'week';

export interface QuestDefinition {
  id: string;
  title: string;
  metric: QuestMetric;
  /** A fixed target, or `dailyGoal` to follow the learner's setting. */
  target: number | 'dailyGoal';
  period: QuestPeriod;
}

/** Daily quests reset at midnight in the learner's stored time zone. */
export const HABIT_QUESTS: readonly QuestDefinition[] = [
  {
    id: 'daily-goal',
    title: 'Hit your daily XP goal',
    metric: 'todayXp',
    target: 'dailyGoal',
    period: 'day',
  },
  {
    id: 'daily-lessons',
    title: 'Finish two lessons today',
    metric: 'todayLessons',
    target: 2,
    period: 'day',
  },
  {
    id: 'weekly-lessons',
    title: 'Finish five lessons this week',
    metric: 'weekLessons',
    target: 5,
    period: 'week',
  },
] as const;

export type AchievementMetric = 'lessons' | 'xp' | 'bestStreak' | 'activeDays';

export interface AchievementDefinition {
  id: string;
  title: string;
  metric: AchievementMetric;
  target: number;
}

/** Every achievement is derived from history; nothing is stored or granted. */
export const HABIT_ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first-lesson', title: 'First step', metric: 'lessons', target: 1 },
  { id: 'ten-lessons', title: 'Ten lessons', metric: 'lessons', target: 10 },
  { id: 'fifty-lessons', title: 'Fifty lessons', metric: 'lessons', target: 50 },
  { id: 'xp-100', title: 'Century', metric: 'xp', target: 100 },
  { id: 'xp-1000', title: 'Thousand club', metric: 'xp', target: 1000 },
  { id: 'streak-3', title: 'Warming up', metric: 'bestStreak', target: 3 },
  { id: 'streak-7', title: 'One week strong', metric: 'bestStreak', target: 7 },
  { id: 'streak-30', title: 'Thirty days', metric: 'bestStreak', target: 30 },
  { id: 'days-7', title: 'Seven active days', metric: 'activeDays', target: 7 },
  { id: 'days-30', title: 'Thirty active days', metric: 'activeDays', target: 30 },
] as const;

export const GEM_LESSON_REWARD = 5;
export const GEM_DAILY_QUEST_REWARD = 10;

export type ShopItemKind = 'cosmetic' | 'freeze';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  kind: ShopItemKind;
  cosmeticId?: string;
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: 'fox-scarf',
    name: 'Speeko scarf',
    description: 'A green scarf for chilly lessons.',
    price: 30,
    kind: 'cosmetic',
    cosmeticId: 'scarf',
  },
  {
    id: 'fox-hat',
    name: 'Party hat',
    description: 'For lesson celebrations.',
    price: 50,
    kind: 'cosmetic',
    cosmeticId: 'hat',
  },
  {
    id: 'fox-glasses',
    name: 'Study glasses',
    description: 'For serious learners.',
    price: 40,
    kind: 'cosmetic',
    cosmeticId: 'glasses',
  },
  {
    id: 'streak-freeze',
    name: 'Streak freeze',
    description: 'One extra day of safety, added to your freeze inventory.',
    price: 50,
    kind: 'freeze',
  },
] as const;
