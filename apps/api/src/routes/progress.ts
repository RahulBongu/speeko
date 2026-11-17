import type { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import {
  ProgressSnapshotSchema,
  SHOP_ITEMS,
  emptyProgress,
  mergeProgress,
  migrateProgress,
  upgradeProgress,
} from '@speeko/core';
import { getDb } from '../db/client.js';
import { progressSnapshots, userInventory } from '../db/schema.js';
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

    // Server-side field ownership for the whole snapshot:
    //
    // Server-owned (authoritative via lesson_events and gem_ledger): whatever
    //   is displayed as a *verified reward* — lessons, XP, quests, gems,
    //   achievements. The snapshot can never write those ledgers.
    // Informational / client-owned (may merge, shown as own device state):
    //   xp, streak, todayXp, todayDate, completed{}, lastCourseId/LessonId,
    //   srs{}, activity{}. They are needed for guest→account migration and
    //   device sync, are re-graded server-side where they engine a lesson, and
    //   never drive currency/leagues/achievements.
    // Client-owned preferences (accepted as-is): dailyGoal, timeZone.
    // Equipped cosmetic: validated against real ownership below. Unknown ids
    //   are rejected; an explicit null un-equips; a matching stored value
    //   (legacy) may keep syncing. Hearts and physical purchases do not exist
    //   in the schema at all — a crafted request cannot conjure them.
    // Unknown keys anywhere in the v2 payload are stripped by the schema, so
    //   they never reach the store.
    // Everything is scoped to the authenticated user; another learner's row is
    //   unreachable from this handler.

    const db = getDb();
    const [existing] = await db
      .select({ data: progressSnapshots.data })
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, userId))
      .limit(1);

    const incoming = upgradeProgress(parsed.data);
    const existingState = existing ? migrateProgress(existing.data) : null;

    // Equipped cosmetics are a preference, not lesson history. A change is
    // validated against real ownership so a crafted snapshot can never equip
    // an item the learner has not bought; an explicit null un-equips. Keeping
    // an already-stored value is allowed so legacy snapshots still sync.
    const requestedCosmetic = incoming.equippedCosmetic;
    if (
      requestedCosmetic !== null &&
      requestedCosmetic !== existingState?.equippedCosmetic
    ) {
      const catalogItem = SHOP_ITEMS.find(
        (item) => item.kind === 'cosmetic' && item.cosmeticId === requestedCosmetic,
      );
      if (!catalogItem) {
        return reply.status(400).send({ error: 'Unknown cosmetic.' });
      }
      const [owned] = await db
        .select({ quantity: userInventory.quantity })
        .from(userInventory)
        .where(
          and(
            eq(userInventory.userId, userId),
            eq(userInventory.itemId, catalogItem.id),
          ),
        )
        .limit(1);
      if (!owned || owned.quantity <= 0) {
        return reply.status(409).send({ error: 'You do not own this cosmetic.' });
      }
    }

    const merged = existingState ? mergeProgress(existingState, incoming) : incoming;
    // Goal, time zone, and the equipped cosmetic are preferences, not
    // activity. They follow this client write even when the more recent lesson
    // history lives on another device, so a goal change or un-equip is never
    // silently reverted.
    const withPreferences = {
      ...merged,
      dailyGoal: incoming.dailyGoal,
      timeZone: incoming.timeZone ?? merged.timeZone,
      equippedCosmetic: incoming.equippedCosmetic,
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
