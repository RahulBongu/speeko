import type { FastifyInstance } from 'fastify';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(here, '../../../content/dist');

export async function courseRoutes(app: FastifyInstance) {
  app.get('/api/courses', async (_request, reply) => {
    try {
      const raw = await readFile(path.join(CONTENT_DIR, 'manifest.json'), 'utf8');
      return reply.send(JSON.parse(raw));
    } catch {
      return reply.status(500).send({ error: 'Course manifest could not be loaded.' });
    }
  });

  app.get('/api/courses/:id', async (request, reply) => {
    const id = (request.params as { id: string }).id;
    if (!/^[a-z0-9-]+$/.test(id)) {
      return reply.status(400).send({ error: 'Invalid course id.' });
    }
    try {
      const raw = await readFile(path.join(CONTENT_DIR, `${id}.json`), 'utf8');
      return reply.send(JSON.parse(raw));
    } catch {
      return reply.status(404).send({ error: 'Course not found.' });
    }
  });
}