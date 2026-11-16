import type { FastifyInstance } from 'fastify';
import { sessionFromHeaders } from './auth.js';

function aiAvailable(): boolean {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_URL);
}

export async function aiRoutes(app: FastifyInstance) {
  app.get('/api/ai/status', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    return reply.send({ available: aiAvailable() });
  });

  app.post('/api/ai/conversation', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    if (!aiAvailable()) {
      return reply.status(503).send({
        error: 'Conversation practice is unavailable until an AI provider is configured.',
        available: false,
      });
    }
    // No provider is configured in this build; keep the honest unavailable state.
    return reply.status(503).send({
      error: 'Conversation practice is unavailable.',
      available: false,
    });
  });
}