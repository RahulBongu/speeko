import { spawn, type ChildProcess } from 'node:child_process';
import { expect, test } from '@playwright/test';

/**
 * Rate limiting is a production defence, not a test resource: the shared e2e
 * API (port 3001) runs with RATE_LIMIT_DISABLED=1 so the whole suite shares
 * one localhost IP without cascading 429s. This suite therefore spawns its
 * OWN API instance on a separate port with the limiter enabled and asserts
 * the 429 contract against it. It uses plain HTTP (no browser) on purpose.
 */

const DEDICATED_PORT = 3399;
const API_URL = `http://localhost:${DEDICATED_PORT}`;
const ORIGIN = 'http://localhost:3000';

// Mirrors PROGRESS_WRITE_RATE_LIMIT in apps/api/src/rate-limit.ts.
const PROGRESS_LIMIT = 30;

let api: ChildProcess | null = null;

async function waitForApi(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('dedicated API did not become healthy');
}

test.beforeAll(async () => {
  const dataDir = `C:/Users/rahul/AppData/Local/Temp/opencode/pglite-rate-limit-${Date.now()}`;
  api = spawn(process.execPath, ['apps/api/dist/index.js'], {
    env: {
      ...process.env,
      PORT: String(DEDICATED_PORT),
      HOST: '127.0.0.1',
      CLIENT_ORIGINS: ORIGIN,
      PGLITE_DATA_DIR: dataDir,
      // RATE_LIMIT_DISABLED deliberately absent: limiter ON.
      NODE_ENV: 'production',
      BETTER_AUTH_SECRET: 'rate-limit-spec-secret-0123456789abcdef',
    },
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  await waitForApi(DEDICATED_PORT, 30_000);
});

test.afterAll(async () => {
  api?.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 500));
  api?.kill('SIGKILL');
  api = null;
});

async function signUp(email: string, name: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ name, email, password: 'speeko-test-password' }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`sign-up failed (${res.status}): ${text}`);
  }
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
  cookie: string,
  snapshot: unknown,
): Promise<ProgressResponse> {
  const res = await fetch(`${API_URL}/api/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', origin: ORIGIN, cookie },
    body: JSON.stringify({ progress: snapshot }),
  });
  let body: ProgressResponse['body'] = null;
  try {
    body = (await res.json()) as ProgressResponse['body'];
  } catch {
    body = null;
  }
  const header = res.headers.get('retry-after');
  return {
    status: res.status,
    retryAfter: header === null ? null : Number(header),
    body,
  };
}

/** Sign-up returns a session cookie from better-auth; keep it per account. */
async function signUpAndGetCookie(
  label: string,
): Promise<{ email: string; cookie: string }> {
  const email = `rate-limit-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
  const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ name: 'Rate Limit Tester', email, password: 'speeko-test-password' }),
  });
  expect(res.status, await res.text()).toBe(200);
  const setCookie = res.headers.get('set-cookie');
  expect(setCookie, 'better-auth must issue a session cookie').toBeTruthy();
  const cookie = (setCookie ?? '').split(';')[0];
  return { email, cookie };
}

test('PUT /api/progress allows up to the limit, then returns 429 with Retry-After', async () => {
  const { cookie } = await signUpAndGetCookie('hammer');

  for (let i = 0; i < PROGRESS_LIMIT; i += 1) {
    const { status } = await putSnapshot(cookie, v2Snapshot({ xp: i }));
    expect(status, `request ${i + 1} should be within the limit`).toBe(200);
  }

  const limited = await putSnapshot(cookie, v2Snapshot({ xp: PROGRESS_LIMIT }));
  expect(limited.status).toBe(429);
  expect(limited.body?.error).toBe('Too Many Requests');
  expect(limited.retryAfter, 'Retry-After header must be a finite number').not.toBeNull();
  expect(Number.isFinite(limited.retryAfter)).toBe(true);
  expect(limited.retryAfter).toBeGreaterThanOrEqual(1);
  expect(limited.retryAfter).toBeLessThanOrEqual(60);
  expect(limited.body?.retryAfter).toBe(limited.retryAfter);
});

test('a fresh account keeps its own progress budget', async () => {
  const { cookie } = await signUpAndGetCookie('limited-account');

  for (let i = 0; i < PROGRESS_LIMIT; i += 1) {
    const { status } = await putSnapshot(cookie, v2Snapshot({ xp: i }));
    expect(status).toBe(200);
  }
  const limited = await putSnapshot(cookie, v2Snapshot());
  expect(limited.status).toBe(429);

  // A completely separate account on the same IP — not throttled.
  const other = await signUpAndGetCookie('other-account');
  const res = await putSnapshot(other.cookie, v2Snapshot());
  expect(res.status).toBe(200);
});
