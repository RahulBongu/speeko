import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import {
  ProgressStateSchema,
  emptyProgress,
  mergeProgress,
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
      progress: row?.data ?? emptyProgress(),
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    });
  });

  app.put('/api/progress', async (request, reply) => {
    const userId = await requireUserId(request.headers);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const parsed = ProgressStateSchema.safeParse(
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

    const incoming = parsed.data;
    const merged = existing ? mergeProgress(existing.data, incoming) : incoming;

    const [saved] = await db
      .insert(progressSnapshots)
      .values({ userId, data: merged })
      .onConflictDoUpdate({
        target: progressSnapshots.userId,
        set: { data: merged, updatedAt: new Date() },
      })
      .returning();

    return reply.send({
      progress: merged,
      updatedAt: saved?.updatedAt?.toISOString() ?? null,
    });
  });
}
