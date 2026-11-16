import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { GEM_DAILY_QUEST_REWARD, GEM_LESSON_REWARD } from '@speeko/core';
import { computeQuests, dayKeyInTimeZone, historyFromLessonEvents } from '@speeko/core';
import { getDb } from './db/client.js';
import { gemLedger, lessonEvents } from './db/schema.js';
import type { Db } from './db/client.js';

export async function awardLessonGem(db: Db, userId: string, attemptId: string): Promise<void> {
  await db
    .insert(gemLedger)
    .values({
      id: randomUUID(),
      userId,
      amount: GEM_LESSON_REWARD,
      reason: 'lesson',
      sourceKey: `lesson:${attemptId}`,
    })
    .onConflictDoNothing({ target: [gemLedger.userId, gemLedger.sourceKey] });
}

export async function awardQuestGems(
  db: Db,
  userId: string,
  timeZone: string | null,
  dailyGoal: number,
): Promise<void> {
  const events = await db
    .select({
      attemptId: lessonEvents.attemptId,
      createdAt: lessonEvents.createdAt,
      xpEarned: lessonEvents.xpEarned,
    })
    .from(lessonEvents)
    .where(eq(lessonEvents.userId, userId));

  const history = historyFromLessonEvents(
    events.map((event) => ({
      attemptId: event.attemptId,
      createdAt: event.createdAt,
      xp: event.xpEarned,
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