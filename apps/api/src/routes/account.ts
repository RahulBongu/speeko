import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { users } from '../db/schema.js';
import { user } from '../db/auth-schema.js';
import { sessionFromHeaders } from './auth.js';

export async function accountRoutes(app: FastifyInstance) {
  app.delete('/api/account', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    const userId = session.user.id;

    const db = getDb();
    try {
      // Delete app-owned rows that reference the legacy `users` table (no
      // cascade there). The `user`-table rows cascade automatically.
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});

      // Delete the Better Auth user row; session/account rows cascade.
      await db.delete(user).where(eq(user.id, userId));

      return reply.status(204).send();
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Could not delete account' });
    }
  });
}
