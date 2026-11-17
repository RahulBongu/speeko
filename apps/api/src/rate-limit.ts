import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sessionFromHeaders } from './routes/auth.js';

/**
 * In-memory, fixed-window rate limiting for abuse-prone endpoints.
 *
 * Scope (release hardening):
 *   - /api/auth/*        — AUTH_RATE_LIMIT (GET and POST)
 *   - PUT /api/progress  — PROGRESS_WRITE_RATE_LIMIT
 *
 * Design:
 *   - Fixed window of {@link windowMs}; every key gets {@link max} hits per
 *     window. Fixed windows are simple and cheap but allow a burst of up to
 *     2× max straddling a window boundary, which is acceptable for abuse
 *     prevention (the goal is blunting credential stuffing and sync loops,
 *     not precise shaping).
 *   - Keys:
 *       /api/auth/*       → `auth:<ip>`  (per caller IP; auth endpoints are
 *                           pre-session, so per-account keys are impossible)
 *       PUT /api/progress → `progress:<userId>:<ip>` when a better-auth
 *                           session resolves, else `progress:anon:<ip>`.
 *                           Per account+IP so one NATted IP does not share a
 *                           budget across accounts, and one account cannot
 *                           spray writes from many IPs under one key.
 *   - Exceeding callers receive HTTP 429 with a JSON body
 *     `{ error, message, retryAfter }` and a `Retry-After` header (seconds
 *     until the current window resets).
 *   - State lives in this module (single-process store). It resets on API
 *     restart and is NOT shared across replicas; a multi-instance deployment
 *     needs a shared store (e.g. Redis) instead.
 *
 * Thresholds are module constants so they can be tuned without touching the
 * hook logic.
 */
export const AUTH_RATE_LIMIT = { windowMs: 60_000, max: 60 } as const;
export const PROGRESS_WRITE_RATE_LIMIT = { windowMs: 60_000, max: 30 } as const;

/** How often the sweeper purges expired buckets. */
const SWEEP_INTERVAL_MS = 60_000;
/** Hard cap on tracked keys; expired buckets are swept inline past this size. */
const MAX_BUCKETS = 10_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function sweepExpired(now: number = Date.now()) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function consume(
  key: string,
  limit: { windowMs: number; max: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (buckets.size >= MAX_BUCKETS) sweepExpired(now);

  const windowStart = Math.floor(now / limit.windowMs) * limit.windowMs;
  const resetAt = windowStart + limit.windowMs;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt !== resetAt) {
    bucket = { count: 0, resetAt };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  return {
    allowed: bucket.count <= limit.max,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
}

async function progressWriteKey(request: FastifyRequest): Promise<string> {
  try {
    const session = await sessionFromHeaders(request.headers);
    const userId = session?.user.id;
    if (userId) return `progress:${userId}:${request.ip}`;
  } catch {
    // Session lookup failed (e.g. DB unavailable); fall back to IP-only so
    // abuse is still throttled. The handler will surface the real error.
  }
  return `progress:anon:${request.ip}`;
}

function isRateLimitingDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === '1' || process.env.NODE_ENV === 'test';
}

async function rateLimitOnRequest(request: FastifyRequest, reply: FastifyReply) {
  if (isRateLimitingDisabled()) return;

  const path = (request.url.split('?', 1)[0] ?? request.url).replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  let key: string | null = null;
  let limit: { windowMs: number; max: number } | null = null;

  if (
    (method === 'GET' || method === 'POST') &&
    (path === '/api/auth' || path.startsWith('/api/auth/'))
  ) {
    key = `auth:${request.ip}`;
    limit = AUTH_RATE_LIMIT;
  } else if (method === 'PUT' && path === '/api/progress') {
    key = await progressWriteKey(request);
    limit = PROGRESS_WRITE_RATE_LIMIT;
  }

  if (!key || !limit) return;

  const { allowed, retryAfterSeconds } = consume(key, limit);
  if (allowed) return;

  reply.header('Retry-After', String(retryAfterSeconds));
  return reply.status(429).send({
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
    retryAfter: retryAfterSeconds,
  });
}

export async function rateLimitPlugin(app: FastifyInstance) {
  const sweeper = setInterval(sweepExpired, SWEEP_INTERVAL_MS);
  sweeper.unref();
  app.addHook('onRequest', rateLimitOnRequest);
  app.addHook('onClose', async () => {
    clearInterval(sweeper);
  });
}

// Skip Fastify's per-plugin encapsulation so the onRequest hook applies to
// routes registered by sibling plugins (authRoutes, progressRoutes, …).
// This is the same mechanism fastify-plugin uses; it is inlined here because
// adding a dependency is not allowed.
(rateLimitPlugin as unknown as Record<symbol, unknown>)[Symbol.for('skip-override')] = true;
