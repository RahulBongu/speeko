import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import {
  ProgressSnapshotSchema,
  emptyProgress,
  mergeProgress,
  migrateProgress,
  upgradeProgress,
} from '@speeko/core';
import { getDb } from '../db/client.js';
import { progressSnapshots } from '../db/schema.js';
import { sessionFromHeaders } from './auth.js';

async function requireUserId(headers: Record<string, string | string[] | undefined>) {
  const session = await sessionFromHeaders(headers);
  return session?.user.id ?? null;
}

export async function progressRoutes(app: FastifyInstance) {
  app.get('/api/progress', async (request, reply) => {
    const userId = await requireUserId(request.headers);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const db = getDb();
    const [row] = await db
      .select()
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, userId))
      .limit(1);

    return reply.send({
      progress: row ? migrateProgress(row.data) : emptyProgress(),
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    });
  });

  app.put('/api/progress', async (request, reply) => {
    const userId = await requireUserId(request.headers);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const parsed = ProgressSnapshotSchema.safeParse(
      (request.body as { progress?: unknown } | null)?.progress,
    );
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid progress snapshot',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const db = getDb();
    const [existing] = await db
      .select({ data: progressSnapshots.data })
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, userId))
      .limit(1);

    const incoming = upgradeProgress(parsed.data);
    const existingState = existing ? migrateProgress(existing.data) : null;
    const merged = existingState ? mergeProgress(existingState, incoming) : incoming;
    // Goal and time zone are preferences, not activity. They follow this
    // client write even when the more recent lesson history lives on another
    // device, so a goal change is never silently reverted.
    const withPreferences = {
      ...merged,
      dailyGoal: incoming.dailyGoal,
      timeZone: incoming.timeZone ?? merged.timeZone,
    };

    const [saved] = await db
      .insert(progressSnapshots)
      .values({ userId, data: withPreferences })
      .onConflictDoUpdate({
        target: progressSnapshots.userId,
        set: { data: withPreferences, updatedAt: new Date() },
      })
      .returning();

    return reply.send({
      progress: withPreferences,
      updatedAt: saved?.updatedAt?.toISOString() ?? null,
    });
  });
}
