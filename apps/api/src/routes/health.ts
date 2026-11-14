import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true, service: 'speeko-api', time: new Date().toISOString() }));
  app.get('/locales', async () => ({
    ui: 'en',
    courses: [
      'en', 'hi', 'bn', 'mr', 'te', 'ta', 'kn', 'ml', 'gu', 'pa', 'or',
    ],
  }));
}
