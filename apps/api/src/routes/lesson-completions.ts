import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  applyReviews,
  emptyProgress,
  migrateProgress,
  recordCompletion,
  reviewsForAttempt,
  scoreLessonAttempt,
  type ProgressState,
} from '@speeko/core';
import { getDb } from '../db/client.js';
import { lessonEvents, progressSnapshots } from '../db/schema.js';
import { findLesson, loadCourse } from '../content.js';
import { readProgress } from '../progress-store.js';
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
        progress: await readProgress(userId),
      });
    }

    const course = loadCourse(body.courseId);
    if (!course) return reply.status(404).send({ error: 'Course not found' });
    const lesson = findLesson(course, body.lessonId);
    if (!lesson) return reply.status(404).send({ error: 'Lesson not found' });

    const scored = scoreLessonAttempt(lesson, body.answers);
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

    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(lessonEvents)
        .values({
          id: randomUUID(),
          userId,
          attemptId: body.attemptId,
          courseId: body.courseId,
          lessonId: body.lessonId,
          xpEarned: scored.score.xp,
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
          xp: scored.score.xp,
          accuracy: scored.score.accuracy,
        },
        now,
      );
      const reviews = reviewsForAttempt(course.locale, lesson.exercises, scored.score.answers);
      const next = applyReviews(completed, reviews, now.getTime());

      await tx
        .update(progressSnapshots)
        .set({ data: next, updatedAt: now })
        .where(eq(progressSnapshots.userId, userId));

      created = inserted[0]!;
      updatedProgress = next;
    });

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
        progress: await readProgress(userId),
      });
    }

    return reply.status(201).send({
      duplicate: false,
      event: serializeEvent(created),
      progress: updatedProgress ?? (await readProgress(userId)),
    });
  });
}
