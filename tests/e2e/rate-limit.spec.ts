import { expect, test, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const ORIGIN = 'http://localhost:3000';

// Mirrors PROGRESS_WRITE_RATE_LIMIT in apps/api/src/rate-limit.ts:
// 30 PUT /api/progress requests per minute per account+IP.
const PROGRESS_LIMIT = 30;

async function signUp(request: APIRequestContext, label: string): Promise<string> {
  const email = `rate-limit-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'Rate Limit Tester', email, password: 'speeko-test-password' },
  });
  expect(response.status(), await response.text()).toBe(200);
  return email;
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

async function putSnapshot(
  request: APIRequestContext,
  snapshot: unknown,
): Promise<{ status: number; headers: Record<string, string>; body: any }> {
  const response = await request.put(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
    data: { progress: snapshot },
  });
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status(), headers: response.headers(), body };
}

test('PUT /api/progress allows up to the limit, then returns 429 with Retry-After', async ({
  request,
}) => {
  await signUp(request, 'hammer');

  for (let i = 0; i < PROGRESS_LIMIT; i += 1) {
    const { status } = await putSnapshot(request, v2Snapshot({ xp: i }));
    expect(status, `request ${i + 1} should be within the limit`).toBe(200);
  }

  const limited = await putSnapshot(request, v2Snapshot({ xp: PROGRESS_LIMIT }));
  expect(limited.status).toBe(429);
  expect(limited.body?.error).toBe('Too Many Requests');
  const retryAfter = Number(limited.headers['retry-after']);
  expect(Number.isFinite(retryAfter)).toBe(true);
  expect(retryAfter).toBeGreaterThanOrEqual(1);
  expect(retryAfter).toBeLessThanOrEqual(60);
  expect(limited.body?.retryAfter).toBe(retryAfter);
});

test('a fresh account keeps its own progress budget', async ({ request, browser }) => {
  await signUp(request, 'limited-account');

  for (let i = 0; i < PROGRESS_LIMIT; i += 1) {
    const { status } = await putSnapshot(request, v2Snapshot({ xp: i }));
    expect(status).toBe(200);
  }
  const limited = await putSnapshot(request, v2Snapshot());
  expect(limited.status).toBe(429);

  // A completely separate session (isolated cookie jar) for a second account:
  // the per account+IP key means it is not throttled by the first account.
  const context = await browser.newContext();
  try {
    const other = context.request;
    const email = `rate-limit-other-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const signUpResponse = await other.post(`${API_URL}/api/auth/sign-up/email`, {
      headers: { origin: ORIGIN },
      data: { name: 'Rate Limit Other', email, password: 'speeko-test-password' },
    });
    expect(signUpResponse.status()).toBe(200);

    const response = await other.put(`${API_URL}/api/progress`, {
      headers: { origin: ORIGIN },
      data: { progress: v2Snapshot() },
    });
    expect(response.status()).toBe(200);
  } finally {
    await context.close();
  }
});
