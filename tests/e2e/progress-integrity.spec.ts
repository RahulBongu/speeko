import { expect, test, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const ORIGIN = 'http://localhost:3000';

const FIRST_LESSON = {
  courseId: 'hi-starter',
  lessonId: 'hi-starter-u1-l1',
  answers: [
    {
      exerciseId: 'hi-starter-u1-l1-e1',
      input: { kind: 'choice', index: 0 },
      ms: 1200,
    },
    {
      exerciseId: 'hi-starter-u1-l1-e2',
      input: { kind: 'choice', index: 0 },
      ms: 900,
    },
    {
      exerciseId: 'hi-starter-u1-l1-e3',
      input: { kind: 'text', value: 'नमस्ते' },
      ms: 2100,
    },
  ],
};

function uniqueAttemptId(label: string): string {
  return `attempt-integrity-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function signUp(request: APIRequestContext, label: string): Promise<string> {
  const email = `integrity-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'Forgery Tester', email, password: 'speeko-test-password' },
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
    todayDate: '2026-11-16',
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
): Promise<{ status: number; body: any }> {
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
  return { status: response.status(), body };
}

test('the progress endpoint rejects unauthenticated callers', async ({ request }) => {
  const response = await request.put(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
    data: { progress: v2Snapshot() },
  });
  expect(response.status()).toBe(401);
});

test('forged XP, streak, completions, and unknown fields cannot grant anything', async ({
  request,
}) => {
  await signUp(request, 'forge');

  const { status, body } = await putSnapshot(
    request,
    v2Snapshot({
      xp: 999999,
      streak: 900,
      todayXp: 500,
      completed: {
        'hi-starter:hi-starter-u1-l1': {
          courseId: 'hi-starter',
          lessonId: 'hi-starter-u1-l1',
          accuracy: 1,
          xp: 999999,
          completedAt: '2026-11-16T10:00:00.000Z',
        },
      },
      // Unknown keys are stripped by the schema and never reach the store.
      gems: 424242,
      hearts: 99,
      freeCosmetic: 'scarf',
    }),
  );
  expect(status).toBe(200);
  // The echoed snapshot is the persisted state: no injected ledger survives.
  expect(JSON.stringify(body.progress)).not.toContain('gems');
  expect(JSON.stringify(body.progress)).not.toContain('hearts');

  // Public profile stats derive from lesson events, so a forged snapshot
  // stays invisible to other learners.
  const profile = await request.get(`${API_URL}/api/profiles/me`, {
    headers: { origin: ORIGIN },
  });
  expect(profile.status()).toBe(200);
  const profileBody = await profile.json();
  expect(profileBody.xp).toBe(0);
  expect(profileBody.streak).toBe(0);
  expect(profileBody.lessons).toBe(0);

  // Currency is ledger-based; the forged payload cannot move the balance.
  const gems = await request.get(`${API_URL}/api/gems`, {
    headers: { origin: ORIGIN },
  });
  expect(gems.status()).toBe(200);
  expect((await gems.json()).balance).toBe(0);

  // Habit totals come from lesson events too.
  const habits = await request.get(`${API_URL}/api/habits`, {
    headers: { origin: ORIGIN },
  });
  expect(habits.status()).toBe(200);
  expect((await habits.json()).habits.totals).toMatchObject({ xp: 0, lessons: 0 });
});

test('completions awarded after a forged snapshot still flow honestly', async ({
  request,
}) => {
  await signUp(request, 'forge-first');
  await putSnapshot(request, v2Snapshot({ xp: 999999, streak: 100 }));

  const attempt = await request.post(`${API_URL}/api/lesson-completions`, {
    headers: { origin: ORIGIN },
    data: { ...FIRST_LESSON, attemptId: uniqueAttemptId('honest') },
  });
  expect(attempt.status()).toBe(201);
  const event = (await attempt.json()).event;
  // Bonus 13 + chooseMeaning 2 + chooseMeaning 2 + typeTranslation 4 = 21.
  expect(event.xp).toBe(21);

  const profile = await request.get(`${API_URL}/api/profiles/me`, {
    headers: { origin: ORIGIN },
  });
  const profileBody = await profile.json();
  expect(profileBody.xp).toBe(21);
  expect(profileBody.lessons).toBe(1);

  // Guest imports are additive by construction: the verified lesson compounds
  // on top of the merged device snapshot (999999 + 21), and a later forged
  // snapshot with lower numbers cannot undo it (merge keeps the max).
  const after = await request.get(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
  });
  expect((await after.json()).progress.xp).toBe(1000020);
  const { body: syncBody } = await putSnapshot(request, v2Snapshot({ xp: 7 }));
  expect(syncBody.progress.xp).toBe(1000020);
});

test('forged cosmetic equipment is rejected without changing the store', async ({
  request,
}) => {
  await signUp(request, 'cosmetic');

  const unknown = await putSnapshot(
    request,
    v2Snapshot({ equippedCosmetic: 'definitely-not-a-cosmetic' }),
  );
  expect(unknown.status).toBe(400);
  expect(unknown.body.error).toMatch(/cosmetic/i);

  const unowned = await putSnapshot(request, v2Snapshot({ equippedCosmetic: 'scarf' }));
  expect(unowned.status).toBe(409);

  const cleared = await putSnapshot(request, v2Snapshot({ equippedCosmetic: null }));
  expect(cleared.status).toBe(200);
  expect(cleared.body.progress.equippedCosmetic).toBeNull();
});

test('cross-account reads return the caller’s own row only', async ({ request, browser }) => {
  await signUp(request, 'attacker-a');
  await putSnapshot(request, v2Snapshot({ xp: 777, streak: 10, lastLessonId: 'hi-starter-u1-l1' }));

  // A completely separate session (isolated cookie jar) for the victim.
  const context = await browser.newContext();
  try {
    const victim = context.request;
    const email = `integrity-victim-${Date.now()}@example.com`;
    const signUp = await victim.post(`${API_URL}/api/auth/sign-up/email`, {
      headers: { origin: ORIGIN },
      data: { name: 'Forgery Victim', email, password: 'speeko-test-password' },
    });
    expect(signUp.status()).toBe(200);
    const progress = await victim.get(`${API_URL}/api/progress`, {
      headers: { origin: ORIGIN },
    });
    expect(progress.status()).toBe(200);
    expect((await progress.json()).progress.xp).toBe(0);
    expect((await progress.json()).progress.lastLessonId).toBeNull();
  } finally {
    await context.close();
  }
});

test('malformed progress payloads are rejected with 400', async ({ request }) => {
  await signUp(request, 'malformed');

  for (const payload of [
    { progress: 'garbage' },
    { progress: 42 },
    { progress: { ...v2Snapshot(), version: 3 } },
    { progress: { ...v2Snapshot(), xp: -1 } },
    { progress: { ...v2Snapshot(), todayXp: 'not-a-number' } },
    { progress: { ...v2Snapshot(), completed: { 'hi-starter:fake': { xp: 'lots' } } } },
  ]) {
    const { status } = await putSnapshot(request, payload.progress);
    expect(status, JSON.stringify(payload)).toBe(400);
  }
});

test('repeated identical updates are stable and idempotent', async ({ request }) => {
  await signUp(request, 'idempotent');
  const snapshot = v2Snapshot({ xp: 120, streak: 4, dailyGoal: 80 });

  const first = await putSnapshot(request, snapshot);
  const second = await putSnapshot(request, snapshot);
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect(first.body.progress.xp).toBe(120);
  expect(first.body.progress.dailyGoal).toBe(80);
  expect(Math.abs(
    new Date(first.body.updatedAt).getTime() - new Date(second.body.updatedAt).getTime(),
  )).toBeGreaterThanOrEqual(0);
});
