import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';

/**
 * Rate limiting is a production defence, not a test resource: the shared e2e
 * API (port 3001) runs with RATE_LIMIT_DISABLED=1 so the whole suite shares
 * one localhost IP without cascading 429s.
 *
 * This suite therefore starts its OWN API process with the limiter enabled
 * and asserts the 429 contract against it. It talks plain HTTP (no browser)
 * and keeps a separate cookie jar per account, so no cookie header is parsed
 * by hand.
 *
 * Determinism notes:
 *   - The child gets an explicitly built environment. In particular
 *     RATE_LIMIT_DISABLED is forced to '0': CI exports '1' for the shared
 *     server and the child would otherwise inherit it, silently disabling
 *     the very limiter under test.
 *   - NODE_ENV is 'development' on purpose. better-auth's built-in auth
 *     limiter is production-only and allows 3 sign-ups per 10s per path
 *     (shared bucket when no client IP is resolvable), which would throttle
 *     account creation during Playwright retries. This suite verifies the
 *     app's own limiter (apps/api/src/rate-limit.ts), not better-auth's.
 *   - The port is chosen dynamically and the data directory lives under the
 *     OS temp dir, so the two Playwright projects and retries never collide.
 *   - The limiter uses a fixed 60s window, so a burst that straddles a
 *     boundary may legitimately see two windows' worth of budget (the
 *     module's documented trade-off, not a bug). burstUntilLimited() handles
 *     that by retrying once with a brand-new account after the window rolls
 *     over, instead of sleeping on the wall clock or asserting on luck.
 */

const ORIGIN = 'http://localhost:3000';

// Mirrors PROGRESS_WRITE_RATE_LIMIT in apps/api/src/rate-limit.ts:
// 30 PUT /api/progress requests per minute per account+IP.
const PROGRESS_LIMIT = 30;
const PROGRESS_WINDOW_MS = 60_000;

// Starting the API includes PGlite migrations on a fresh data directory.
const API_START_TIMEOUT_MS = 120_000;

let apiPort = 0;
let apiUrl = '';
let dataDir = '';
let apiChild: ChildProcessWithoutNullStreams | null = null;
let apiLogs = '';

// A burst plus at most one 60s window-boundary retry per test.
test.describe.configure({ timeout: 240_000 });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reserve an ephemeral port, then release it for the child to bind. */
function pickFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => {
        if (port <= 0) reject(new Error('could not allocate a free port'));
        else resolve(port);
      });
    });
  });
}

async function waitForHealth(child: ChildProcessWithoutNullStreams): Promise<void> {
  const deadline = Date.now() + API_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API exited with code ${child.exitCode}\n${apiLogs}`);
    }
    try {
      const response = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await sleep(200);
  }
  throw new Error(
    `API did not become healthy on port ${apiPort} within ${API_START_TIMEOUT_MS}ms\n${apiLogs}`,
  );
}

test.beforeAll(async () => {
  apiPort = await pickFreePort();
  apiUrl = `http://127.0.0.1:${apiPort}`;
  dataDir = await mkdtemp(join(tmpdir(), 'speeko-rate-limit-'));

  // Never let a developer's DATABASE_URL point this throwaway instance at a
  // real database; the contract test must own an isolated PGlite directory.
  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(apiPort),
    HOST: '127.0.0.1',
    CLIENT_ORIGINS: ORIGIN,
    BETTER_AUTH_URL: apiUrl,
    BETTER_AUTH_SECRET: `${randomUUID()}${randomUUID()}`,
    PGLITE_DATA_DIR: dataDir,
    NODE_ENV: 'development',
    // Must win over the CI step's RATE_LIMIT_DISABLED=1.
    RATE_LIMIT_DISABLED: '0',
  };
  delete childEnv.DATABASE_URL;

  apiChild = spawn(process.execPath, ['apps/api/dist/index.js'], {
    env: childEnv,
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  apiChild.stdout.on('data', (chunk: Buffer) => {
    apiLogs += chunk.toString();
  });
  apiChild.stderr.on('data', (chunk: Buffer) => {
    apiLogs += chunk.toString();
  });

  await waitForHealth(apiChild);
});

test.afterAll(async () => {
  if (apiChild) {
    apiChild.kill('SIGTERM');
    const deadline = Date.now() + 5_000;
    while (apiChild.exitCode === null && Date.now() < deadline) {
      await sleep(100);
    }
    if (apiChild.exitCode === null) apiChild.kill('SIGKILL');
    apiChild = null;
  }
  if (dataDir) {
    // Best-effort: a cleanup failure must not turn passing assertions red.
    try {
      await rm(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // temp directory leakage is harmless
    }
    dataDir = '';
  }
});

function errorContext(response: APIResponse, body: string): string {
  const headers = Object.entries(response.headers())
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  return `status=${response.status()}\nheaders:\n${headers}\nbody:\n${body}`;
}

/**
 * Create a throwaway account through the real sign-up endpoint and keep the
 * returned session cookie in a fresh request context (a real cookie jar).
 * Signing up is only half the contract: we then ask better-auth to resolve
 * the session, so a missing/invalid cookie fails here with a clear message
 * instead of turning the rate-limit assertions into misleading 401s.
 */
async function newAccount(label: string): Promise<APIRequestContext> {
  const context = await playwrightRequest.newContext({
    baseURL: apiUrl,
    extraHTTPHeaders: { origin: ORIGIN },
  });
  const email = `rate-limit-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;

  const signUp = await context.post('/api/auth/sign-up/email', {
    data: { name: 'Rate Limit Tester', email, password: 'speeko-test-password' },
  });
  const signUpBody = await signUp.text();
  expect(
    signUp.status(),
    `sign-up must succeed:\n${errorContext(signUp, signUpBody)}`,
  ).toBe(200);

  const session = await context.get('/api/auth/get-session');
  const sessionBody = await session.text();
  expect(
    session.status(),
    `session lookup must succeed:\n${errorContext(session, sessionBody)}`,
  ).toBe(200);
  const parsed = JSON.parse(sessionBody) as { user?: { email?: string } } | null;
  expect(
    parsed?.user?.email,
    `sign-up must establish a session cookie; get-session returned:\n${sessionBody}`,
  ).toBe(email);

  return context;
}

async function closeAccount(context: APIRequestContext): Promise<void> {
  await context.dispose();
}

/**
 * Fill one account's progress budget and return the response that crossed
 * the line. Each attempt starts from a brand-new account, because the limiter
 * counts per account+IP: reusing an account would carry its consumed budget
 * into the retry.
 *
 * The limiter's fixed window means a burst that straddles a boundary can
 * legitimately be split across two windows, leaving the 31st request allowed.
 * In that case we drop the account, wait for the window to roll over, and try
 * once more; a second miss fails with the actual status. This is deterministic
 * without depending on where "now" happens to fall in the minute.
 */
async function burstUntilLimited(label: string): Promise<{
  context: APIRequestContext;
  limited: ProgressResponse;
}> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const context = await newAccount(`${label}-${attempt}`);
    for (let i = 0; i < PROGRESS_LIMIT; i += 1) {
      const { status } = await putSnapshot(context, v2Snapshot({ xp: i }));
      expect(status, `request ${i + 1} of the burst should be within the limit`).toBe(200);
    }

    const limited = await putSnapshot(context, v2Snapshot({ xp: PROGRESS_LIMIT }));
    if (limited.status === 429) return { context, limited };

    await closeAccount(context);
    expect(
      attempt,
      `request ${PROGRESS_LIMIT + 1} returned ${limited.status}, expected 429 — ` +
        'the limiter did not engage in either window',
    ).toBe(1);

    const remaining = PROGRESS_WINDOW_MS - (Date.now() % PROGRESS_WINDOW_MS);
    await sleep(remaining + 1_000);
  }

  throw new Error('unreachable: burstUntilLimited exhausted its attempts');
}

function v2Snapshot(overrides: Record<string, unknown> = {}) {
  return {
    version: 2,
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    todayDate: '2026-11-17',
    todayXp: 0,
    completed: {},
    lastCourseId: null,
    lastLessonId: null,
    srs: {},
    activity: {},
    dailyGoal: 50,
    timeZone: null,
    equippedCosmetic: null,
    ...overrides,
  };
}

interface ProgressResponse {
  status: number;
  retryAfter: number | null;
  body: { error?: string; retryAfter?: number } | null;
}

async function putSnapshot(
  context: APIRequestContext,
  snapshot: unknown,
): Promise<ProgressResponse> {
  const response = await context.put('/api/progress', {
    data: { progress: snapshot },
  });
  let body: ProgressResponse['body'] = null;
  try {
    body = (await response.json()) as ProgressResponse['body'];
  } catch {
    body = null;
  }
  const header = response.headers()['retry-after'];
  return {
    status: response.status(),
    retryAfter: header === undefined ? null : Number(header),
    body,
  };
}

test('PUT /api/progress allows up to the limit, then returns 429 with Retry-After', async () => {
  const { context, limited } = await burstUntilLimited('hammer');
  try {
    expect(limited.body?.error).toBe('Too Many Requests');
    expect(limited.retryAfter, 'Retry-After header must be a finite number').not.toBeNull();
    expect(Number.isFinite(limited.retryAfter)).toBe(true);
    expect(limited.retryAfter).toBeGreaterThanOrEqual(1);
    expect(limited.retryAfter).toBeLessThanOrEqual(60);
    expect(limited.body?.retryAfter).toBe(limited.retryAfter);
  } finally {
    await closeAccount(context);
  }
});

test('a fresh account keeps its own progress budget', async () => {
  const { context: limitedAccount } = await burstUntilLimited('limited-account');
  await closeAccount(limitedAccount);

  // A completely separate account on the same IP — not throttled.
  const other = await newAccount('other-account');
  try {
    const response = await putSnapshot(other, v2Snapshot());
    expect(response.status).toBe(200);
  } finally {
    await closeAccount(other);
  }
});
