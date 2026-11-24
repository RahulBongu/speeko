import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { energy, progress, srsCards, streaks, users } from '../db/schema.js';
import { user } from '../db/auth-schema.js';
import { sessionFromHeaders } from './auth.js';

export async function accountRoutes(app: FastifyInstance) {
  app.delete('/api/account', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    const userId = session.user.id;

    const db = getDb();
    try {
      // Everything for one account must disappear together. The legacy tables
      // reference `users` without ON DELETE CASCADE, so delete their rows
      // first inside a transaction; the `user`-table rows cascade on their own.
      // Previously a failed legacy delete was swallowed, which could leave
      // activity/PII behind after the account was gone.
      await db.transaction(async (tx) => {
        await tx.delete(progress).where(eq(progress.userId, userId));
        await tx.delete(srsCards).where(eq(srsCards.userId, userId));
        await tx.delete(streaks).where(eq(streaks.userId, userId));
        await tx.delete(energy).where(eq(energy.userId, userId));
        await tx.delete(users).where(eq(users.id, userId));
        await tx.delete(user).where(eq(user.id, userId));
      });

      return reply.status(204).send();
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Could not delete account' });
    }
  });
}
