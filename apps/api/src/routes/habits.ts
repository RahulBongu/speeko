import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { buildHabitReport, dayKeyInTimeZone, historyFromLessonEvents } from '@speeko/core';
import { getDb } from '../db/client.js';
import { lessonEvents, userInventory } from '../db/schema.js';
import { readProgress } from '../progress-store.js';
import { sessionFromHeaders } from './auth.js';

/**
 * Habit report for the signed-in learner. Quests, streaks, the calendar, and
 * achievements are all derived from append-only lesson events; the progress
 * snapshot contributes only preferences (goal and time zone).
 */
export async function habitRoutes(app: FastifyInstance) {
  app.get('/api/habits', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    const userId = session.user.id;

    const db = getDb();
    const [progress, events] = await Promise.all([
      readProgress(userId),
      db
        .select({
          attemptId: lessonEvents.attemptId,
          createdAt: lessonEvents.createdAt,
          xpEarned: lessonEvents.xpEarned,
        })
        .from(lessonEvents)
        .where(eq(lessonEvents.userId, userId)),
    ]);

    const history = historyFromLessonEvents(
      events.map((event) => ({
        attemptId: event.attemptId,
        createdAt: event.createdAt,
        xp: event.xpEarned,
      })),
      progress.timeZone,
    );

    const report = buildHabitReport(history, {
      asOfDay: dayKeyInTimeZone(new Date(), progress.timeZone),
      timeZone: progress.timeZone,
      dailyGoal: progress.dailyGoal,
    });

    const [freezeRow] = await db
      .select({ quantity: userInventory.quantity })
      .from(userInventory)
      .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, 'streak-freeze')))
      .limit(1);
    const credits = freezeRow?.quantity ?? 0;
    if (credits > 0) {
      report.streak.freezesAvailable = Math.min(
        report.streak.maxFreezes,
        report.streak.freezesAvailable + credits,
      );
    }

    return reply.send({ habits: report });
  });
}
