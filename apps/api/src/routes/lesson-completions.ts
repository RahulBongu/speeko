import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  GEM_LESSON_REWARD,
  applyReviews,
  emptyProgress,
  migrateProgress,
  eligibleExercises,
  recordCompletion,
  reviewsForAttempt,
  scoreLessonAttempt,
  type ProgressState,
} from '@speeko/core';
import { getDb } from '../db/client.js';
import {
  gemLedger,
  lessonCompletionRewards,
  lessonEvents,
  progressSnapshots,
} from '../db/schema.js';
import { findLesson, loadCourse } from '../content.js';
import { readProgress } from '../progress-store.js';
import { awardQuestGems, lessonGemSourceKey } from '../gem-awards.js';
import { sessionFromHeaders } from './auth.js';

const AnswerInputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('choice'), index: z.number().int().min(0).max(50) }),
  z.object({ kind: z.literal('text'), value: z.string().min(1).max(1000) }),
  z.object({
    kind: z.literal('tokens'),
    value: z.array(z.string().min(1).max(200)).min(1).max(50),
  }),
  z.object({ kind: z.literal('pairs'), mismatches: z.number().int().min(0).max(1000) }),
  z.object({
    kind: z.literal('speak'),
    transcript: z.string().max(2000),
    selfReported: z.boolean(),
  }),
]);

const AttemptBodySchema = z
  .object({
    attemptId: z
      .string()
      .min(8)
      .max(80)
      .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, hyphens, or underscores'),
    courseId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
    lessonId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/),
    answers: z
      .array(
        z.object({
          exerciseId: z.string().min(1).max(120),
          input: AnswerInputSchema,
          ms: z.number().int().min(0).max(3_600_000).optional(),
        }),
      )
      .min(1)
      .max(100),
  })
  .strict();

type LessonEventRow = typeof lessonEvents.$inferSelect;

function serializeEvent(row: LessonEventRow) {
  return {
    id: row.id,
    attemptId: row.attemptId,
    courseId: row.courseId,
    lessonId: row.lessonId,
    xp: row.xpEarned,
    accuracy: row.accuracyBp / 10_000,
    heartsLeft: row.heartsLeft,
    maxCombo: row.maxCombo,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Whether this specific event owns the lesson's one-time completion reward.
 * A replay event has `xpEarned = 0`; an old duplicate retry of a historical
 * non-reward attempt reports false even though the lesson was completed.
 * The gem count is read from the ledger: a backfilled historical completion owns
 * its reward row but never minted a retroactive lesson gem.
 */
async function completionForEvent(
  db: ReturnType<typeof getDb>,
  userId: string,
  event: LessonEventRow,
) {
  const [reward] = await db
    .select({ attemptId: lessonCompletionRewards.attemptId })
    .from(lessonCompletionRewards)
    .where(
      and(
        eq(lessonCompletionRewards.userId, userId),
        eq(lessonCompletionRewards.courseId, event.courseId),
        eq(lessonCompletionRewards.lessonId, event.lessonId),
      ),
    )
    .limit(1);
  const rewarded = reward?.attemptId === event.attemptId;
  let gems = 0;
  if (rewarded) {
    const [gem] = await db
      .select({ amount: gemLedger.amount })
      .from(gemLedger)
      .where(
        and(
          eq(gemLedger.userId, userId),
          eq(gemLedger.sourceKey, lessonGemSourceKey(event.courseId, event.lessonId)),
        ),
      )
      .limit(1);
    gems = gem?.amount ?? 0;
  }
  return {
    rewarded,
    xp: rewarded ? event.xpEarned : 0,
    gems,
  };
}

export async function lessonCompletionRoutes(app: FastifyInstance) {
  app.post('/api/lesson-completions', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    const userId = session.user.id;

    const parsed = AttemptBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid lesson attempt',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    const body = parsed.data;

    // Idempotency comes first: a retry returns the original event without
    // re-grading, even if the retried payload is not identical.
    const db = getDb();
    const [existing] = await db
      .select()
      .from(lessonEvents)
      .where(and(eq(lessonEvents.userId, userId), eq(lessonEvents.attemptId, body.attemptId)))
      .limit(1);

    if (existing) {
      if (existing.courseId !== body.courseId || existing.lessonId !== body.lessonId) {
        return reply.status(409).send({
          error: 'attemptId was already used for a different lesson',
        });
      }
      return reply.status(200).send({
        duplicate: true,
        event: serializeEvent(existing),
        completion: await completionForEvent(db, userId, existing),
        progress: await readProgress(userId),
      });
    }

    const course = loadCourse(body.courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const lesson = findLesson(course, body.lessonId);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const eligibleLesson = {
      ...lesson,
      exercises: eligibleExercises(lesson.exercises),
    };
    const scored = scoreLessonAttempt(eligibleLesson, body.answers);
    if (!scored.ok) {
      return reply.status(422).send({ error: 'Invalid lesson attempt', reason: scored.reason });
    }
    if (!scored.score.passed) {
      return reply.status(422).send({
        error: 'Lesson not completed',
        reason: 'Hearts ran out before the end of the lesson.',
      });
    }

    const now = new Date();
    let created: LessonEventRow | null = null;
    let updatedProgress: ProgressState | null = null;
    let completionRewarded = false;

    await db.transaction(async (tx) => {
      // Insert the attempt first. The unique (user, attemptId) key decides
      // which concurrent request owns this attempt, so a same-key retry can
      // never reach the reward claim below.
      const inserted = await tx
        .insert(lessonEvents)
        .values({
          id: randomUUID(),
          userId,
          attemptId: body.attemptId,
          courseId: body.courseId,
          lessonId: body.lessonId,
          xpEarned: 0,
          accuracyBp: Math.round(scored.score.accuracy * 10_000),
          heartsLeft: scored.score.heartsLeft,
          maxCombo: scored.score.maxCombo,
          answers: scored.score.answers,
          createdAt: now,
        })
        .onConflictDoNothing({
          target: [lessonEvents.userId, lessonEvents.attemptId],
        })
        .returning();

      // A concurrent retry won the unique key. The caller below returns that
      // original event instead of awarding XP a second time.
      if (inserted.length === 0) return;

      // The durable one-time invariant: at most one row per learner, course,
      // and lesson. A new attemptId cannot bypass it, and concurrent attempts
      // serialize on the unique index. Only the winner may grant XP or a gem.
      const claimed = await tx
        .insert(lessonCompletionRewards)
        .values({
          id: randomUUID(),
          userId,
          courseId: body.courseId,
          lessonId: body.lessonId,
          attemptId: body.attemptId,
          xp: scored.score.xp,
          createdAt: now,
        })
        .onConflictDoNothing({
          target: [
            lessonCompletionRewards.userId,
            lessonCompletionRewards.courseId,
            lessonCompletionRewards.lessonId,
          ],
        })
        .returning();

      completionRewarded = claimed.length > 0;
      const awardedXp = completionRewarded ? scored.score.xp : 0;

      if (completionRewarded) {
        // Credit the attempt only after the reward claim. Replay events keep
        // full grading/SRS history but carry 0 completion XP.
        await tx
          .update(lessonEvents)
          .set({ xpEarned: awardedXp })
          .where(eq(lessonEvents.id, inserted[0]!.id));

        // The lesson gem shares the reward transaction: if either write fails,
        // neither the XP nor the gem can be left behind.
        await tx
          .insert(gemLedger)
          .values({
            id: randomUUID(),
            userId,
            amount: GEM_LESSON_REWARD,
            reason: 'lesson',
            sourceKey: lessonGemSourceKey(body.courseId, body.lessonId),
            metadata: {
              attemptId: body.attemptId,
              courseId: body.courseId,
              lessonId: body.lessonId,
              xp: awardedXp,
            },
          })
          .onConflictDoNothing({
            target: [gemLedger.userId, gemLedger.sourceKey],
          });
      }

      // Ensure the row exists, then lock it so two different attempts for the
      // same learner cannot read the same snapshot and overwrite each other.
      await tx
        .insert(progressSnapshots)
        .values({ userId, data: emptyProgress(now), updatedAt: now })
        .onConflictDoNothing({ target: progressSnapshots.userId });

      const [row] = await tx
        .select()
        .from(progressSnapshots)
        .where(eq(progressSnapshots.userId, userId))
        .limit(1)
        .for('update');

      const base = row ? migrateProgress(row.data) : emptyProgress(now);
      const completed = recordCompletion(
        base,
        {
          courseId: body.courseId,
          lessonId: body.lessonId,
          xp: awardedXp,
          accuracy: scored.score.accuracy,
        },
        now,
      );
      const reviews = reviewsForAttempt(
        course.locale,
        eligibleLesson.exercises,
        scored.score.answers,
      );
      const next = applyReviews(completed, reviews, now.getTime());

      await tx
        .update(progressSnapshots)
        .set({ data: next, updatedAt: now })
        .where(eq(progressSnapshots.userId, userId));

      const event = inserted[0]!;
      event.xpEarned = awardedXp;
      created = event;
      updatedProgress = next;
    });

    const finalProgress = updatedProgress ?? (await readProgress(userId));
    if (created) {
      // Daily quest gems are a separate, once-per-day economy. They are
      // re-derived from the reward ledger on gem/shop reads, so a failure here
      // retries safely and never duplicates the lesson reward.
      await awardQuestGems(db, userId, finalProgress.timeZone, finalProgress.dailyGoal);
    }

    if (!created) {
      const [event] = await db
        .select()
        .from(lessonEvents)
        .where(and(eq(lessonEvents.userId, userId), eq(lessonEvents.attemptId, body.attemptId)))
        .limit(1);
      if (!event) {
        return reply.status(409).send({ error: 'Could not record lesson completion' });
      }
      if (event.courseId !== body.courseId || event.lessonId !== body.lessonId) {
        return reply.status(409).send({
          error: 'attemptId was already used for a different lesson',
        });
      }
      return reply.status(200).send({
        duplicate: true,
        event: serializeEvent(event),
        completion: await completionForEvent(db, userId, event),
        progress: await readProgress(userId),
      });
    }

    return reply.status(201).send({
      duplicate: false,
      event: serializeEvent(created),
      completion: {
        rewarded: completionRewarded,
        xp: completionRewarded ? scored.score.xp : 0,
        gems: completionRewarded ? GEM_LESSON_REWARD : 0,
      },
      progress: updatedProgress ?? (await readProgress(userId)),
    });
  });
}
