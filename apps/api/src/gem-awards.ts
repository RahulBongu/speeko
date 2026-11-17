import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import {
  GEM_DAILY_QUEST_REWARD,
  computeQuests,
  dayKeyInTimeZone,
  historyFromLessonEvents,
} from '@speeko/core';
import { gemLedger, lessonCompletionRewards } from './db/schema.js';
import type { Db } from './db/client.js';

/**
 * Stable gem identity for a first lesson completion. It is deliberately
 * independent of the client's `attemptId`, so a replay with a new attempt
 * cannot mint a second gem. Colons cannot appear in `attemptId`, so this can
 * never collide with the historical `lesson:<attemptId>` keys.
 */
export function lessonGemSourceKey(courseId: string, lessonId: string): string {
  return `lesson:${courseId}:${lessonId}`;
}

/**
 * Daily quest gems derive from the first-completion reward ledger, not raw
 * attempts. Practice replays still record events and keep streaks alive, but
 * they cannot complete "finish two lessons today" or the daily XP goal again.
 * This function is read-time/idempotent: if a previous award failed, the next
 * gem or shop read grants the same once-per-day quest safely.
 */
export async function awardQuestGems(
  db: Db,
  userId: string,
  timeZone: string | null,
  dailyGoal: number,
): Promise<void> {
  const rewards = await db
    .select({
      attemptId: lessonCompletionRewards.attemptId,
      createdAt: lessonCompletionRewards.createdAt,
      xp: lessonCompletionRewards.xp,
    })
    .from(lessonCompletionRewards)
    .where(eq(lessonCompletionRewards.userId, userId));

  const history = historyFromLessonEvents(
    rewards.map((reward) => ({
      attemptId: reward.attemptId,
      createdAt: reward.createdAt,
      xp: reward.xp,
    })),
    timeZone,
  );
  const asOfDay = dayKeyInTimeZone(new Date(), timeZone);
  const quests = computeQuests(history, asOfDay, dailyGoal);

  for (const quest of quests) {
    if (!quest.complete || quest.period !== 'day') continue;
    await db
      .insert(gemLedger)
      .values({
        id: randomUUID(),
        userId,
        amount: GEM_DAILY_QUEST_REWARD,
        reason: 'quest',
        sourceKey: `quest:${quest.id}:${asOfDay}`,
      })
      .onConflictDoNothing({ target: [gemLedger.userId, gemLedger.sourceKey] });
  }
}
