import type { FastifyInstance } from 'fastify';
import { and, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  SHOP_ITEMS,
  computeQuests,
  dayKeyInTimeZone,
  historyFromLessonEvents,
} from '@speeko/core';
import { getDb } from '../db/client.js';
import {
  gemLedger,
  lessonEvents,
  userInventory,
} from '../db/schema.js';
import { readProgress } from '../progress-store.js';
import { sessionFromHeaders } from './auth.js';
import { awardQuestGems } from '../gem-awards.js';

async function requireUserId(headers: Record<string, string | string[] | undefined>) {
  const session = await sessionFromHeaders(headers);
  return session?.user.id ?? null;
}

async function gemBalance(db: ReturnType<typeof getDb>, userId: string): Promise<number> {
  const rows = await db
    .select({ amount: gemLedger.amount })
    .from(gemLedger)
    .where(eq(gemLedger.userId, userId));
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

async function freezeCredits(db: ReturnType<typeof getDb>, userId: string): Promise<number> {
  const [row] = await db
    .select({ quantity: userInventory.quantity })
    .from(userInventory)
    .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, 'streak-freeze')))
    .limit(1);
  return row?.quantity ?? 0;
}

async function ownedItems(db: ReturnType<typeof getDb>, userId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ itemId: userInventory.itemId, quantity: userInventory.quantity })
    .from(userInventory)
    .where(eq(userInventory.userId, userId));
  return new Map(rows.map((row) => [row.itemId, row.quantity]));
}

export async function shopRoutes(app: FastifyInstance) {
  app.get('/api/gems', async (request, reply) => {
    const userId = await requireUserId(request.headers);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const db = getDb();
    const progress = await readProgress(userId);
    await awardQuestGems(db, userId, progress.timeZone, progress.dailyGoal);

    const [balance, recent, credits] = await Promise.all([
      gemBalance(db, userId),
      db
        .select()
        .from(gemLedger)
        .where(eq(gemLedger.userId, userId))
        .orderBy(sql`${gemLedger.createdAt} desc`)
        .limit(20),
      freezeCredits(db, userId),
    ]);

    return reply.send({ balance, freezeCredits: credits, ledger: recent });
  });

  app.get('/api/shop', async (request, reply) => {
    const userId = await requireUserId(request.headers);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const db = getDb();
    const progress = await readProgress(userId);
    await awardQuestGems(db, userId, progress.timeZone, progress.dailyGoal);

    const [balance, owned, credits] = await Promise.all([
      gemBalance(db, userId),
      ownedItems(db, userId),
      freezeCredits(db, userId),
    ]);

    const items = SHOP_ITEMS.map((item) => ({
      ...item,
      owned: (owned.get(item.id) ?? 0) > 0,
      quantity: owned.get(item.id) ?? 0,
      canAfford: balance >= item.price,
    }));

    return reply.send({ balance, freezeCredits: credits, items });
  });

  app.post('/api/shop/purchase', async (request, reply) => {
    const userId = await requireUserId(request.headers);
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const body = (request.body ?? {}) as { itemId?: unknown; requestId?: unknown };
    const itemId = typeof body.itemId === 'string' ? body.itemId : '';
    const requestId =
      typeof body.requestId === 'string' && body.requestId.length >= 8 && body.requestId.length <= 128
        ? body.requestId
        : randomUUID();
    const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId);
    if (!item) return reply.status(400).send({ error: 'Unknown shop item.' });

    const db = getDb();
    const sourceKey = `purchase:${item.id}:${requestId}`;

    // Idempotent replay: a retried request with the same key returns the
    // original result instead of charging a second time.
    const [existing] = await db
      .select()
      .from(gemLedger)
      .where(and(eq(gemLedger.userId, userId), eq(gemLedger.sourceKey, sourceKey)))
      .limit(1);
    if (existing) {
      const [balance, owned, credits] = await Promise.all([
        gemBalance(db, userId),
        ownedItems(db, userId),
        freezeCredits(db, userId),
      ]);
      return reply.send({
        duplicate: true,
        balance,
        freezeCredits: credits,
        item: { ...item, owned: (owned.get(item.id) ?? 0) > 0, quantity: owned.get(item.id) ?? 0 },
      });
    }

    const progress = await readProgress(userId);
    const earnedFreezes = 0; // earned freezes are derived in /api/habits; cap check uses stored credits only here
    void earnedFreezes;

    try {
      const result = await db.transaction(async (tx) => {
        // Serialize all purchases for this user.
        await tx.execute(sql`SELECT id FROM "user" WHERE id = ${userId} FOR UPDATE`);

        const [ownedRow] = await tx
          .select({ quantity: userInventory.quantity })
          .from(userInventory)
          .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, item.id)))
          .limit(1);

        if (item.kind === 'cosmetic' && (ownedRow?.quantity ?? 0) > 0) {
          throw new Error('ALREADY_OWNED');
        }

        if (item.kind === 'freeze') {
          const credits = ownedRow?.quantity ?? 0;
          if (credits >= 2) {
            throw new Error('FREEZE_INVENTORY_FULL');
          }
        }

        const rows = await tx
          .select({ amount: gemLedger.amount })
          .from(gemLedger)
          .where(eq(gemLedger.userId, userId));
        const balance = rows.reduce((sum, row) => sum + row.amount, 0);
        if (balance < item.price) {
          throw new Error('INSUFFICIENT_GEMS');
        }

        await tx.insert(gemLedger).values({
          id: randomUUID(),
          userId,
          amount: -item.price,
          reason: 'purchase',
          sourceKey,
          metadata: { itemId: item.id },
        });

        if (item.kind === 'cosmetic') {
          await tx
            .insert(userInventory)
            .values({ userId, itemId: item.id, quantity: 1 })
            .onConflictDoUpdate({
              target: [userInventory.userId, userInventory.itemId],
              set: { quantity: 1, updatedAt: new Date() },
            });
        } else {
          await tx
            .insert(userInventory)
            .values({ userId, itemId: item.id, quantity: 1 })
            .onConflictDoUpdate({
              target: [userInventory.userId, userInventory.itemId],
              set: { quantity: sql`${userInventory.quantity} + 1`, updatedAt: new Date() },
            });
        }

        const newBalance = balance - item.price;
        const [newOwned] = await tx
          .select({ quantity: userInventory.quantity })
          .from(userInventory)
          .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, item.id)))
          .limit(1);

        return {
          balance: newBalance,
          quantity: newOwned?.quantity ?? 1,
        };
      });

      const credits = await freezeCredits(db, userId);
      const owned = await ownedItems(db, userId);
      return reply.send({
        duplicate: false,
        balance: result.balance,
        freezeCredits: credits,
        item: {
          ...item,
          owned: (owned.get(item.id) ?? 0) > 0,
          quantity: result.quantity,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase failed.';
      if (message === 'INSUFFICIENT_GEMS') {
        return reply.status(409).send({ error: 'Not enough gems for this item.' });
      }
      if (message === 'ALREADY_OWNED') {
        return reply.status(409).send({ error: 'You already own this item.' });
      }
      if (message === 'FREEZE_INVENTORY_FULL') {
        return reply.status(409).send({ error: 'Your freeze inventory is full.' });
      }
      // Only the gem-ledger sourceKey uniqueness race is a successful replay.
      // Matching any error containing "unique"/"duplicate" could mask an
      // unrelated constraint failure as a paid-order success.
      const isSourceKeyRace =
        /unique constraint|duplicate key/i.test(message) &&
        /gem_ledger_user_source_idx/i.test(message);
      if (isSourceKeyRace) {
        const [balance, owned, credits] = await Promise.all([
          gemBalance(db, userId),
          ownedItems(db, userId),
          freezeCredits(db, userId),
        ]);
        return reply.send({
          duplicate: true,
          balance,
          freezeCredits: credits,
          item: { ...item, owned: (owned.get(item.id) ?? 0) > 0, quantity: owned.get(item.id) ?? 0 },
        });
      }
      throw error;
    }
  });
}