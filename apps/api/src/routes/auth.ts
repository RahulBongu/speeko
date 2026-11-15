import type { FastifyInstance } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';

/**
 * Mounts Better Auth's fetch handler on Fastify. Cookie headers are forwarded
 * individually so sign-in and sign-out behave correctly across origins.
 */
export async function authRoutes(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host ?? 'localhost:3001'}`);
        const req = new Request(url, {
          method: request.method,
          headers: fromNodeHeaders(request.headers),
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        });
        const response = await auth.handler(req);
        reply.status(response.status);
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() !== 'set-cookie') reply.header(key, value);
        });
        const cookies = response.headers.getSetCookie();
        if (cookies.length > 0) reply.header('set-cookie', cookies);
        return reply.send(response.body ? await response.text() : null);
      } catch (error) {
        request.log.error({ err: error }, 'Authentication handler failed');
        return reply.status(500).send({ error: 'Internal authentication error' });
      }
    },
  });
}

export async function sessionFromHeaders(headers: Record<string, string | string[] | undefined>) {
  return auth.api.getSession({ headers: fromNodeHeaders(headers) });
}
