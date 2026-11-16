import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { progressRoutes } from './routes/progress.js';
import { lessonCompletionRoutes } from './routes/lesson-completions.js';
import { habitRoutes } from './routes/habits.js';
import { shopRoutes } from './routes/shop.js';
import { socialRoutes } from './routes/social.js';
import { courseRoutes } from './routes/courses.js';
import { closeDb, runMigrations } from './db/client.js';

const app = Fastify({ logger: true });

const clientOrigins = (process.env.CLIENT_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

async function main() {
  await app.register(cors, {
    origin: clientOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(progressRoutes);
  await app.register(lessonCompletionRoutes);
  await app.register(habitRoutes);
  await app.register(shopRoutes);
  await app.register(socialRoutes);
  await app.register(courseRoutes);
  app.addHook('onClose', async () => {
    await closeDb();
  });
  try {
    await runMigrations();
    app.log.info('Database migrations applied.');
  } catch (err) {
    app.log.warn({ err }, 'Migration step skipped/failed (DB may be unavailable).');
  }

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen({ port, host });
  app.log.info(`Speeko API listening on http://${host}:${port}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
