import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const ORIGIN = 'http://localhost:3000';

function throwawayEmail(label: string): string {
  return `delete-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@speeko.test`;
}

async function signUp(request: APIRequestContext, label: string): Promise<{ email: string; password: string }> {
  const email = throwawayEmail(label);
  const password = `speeko-delete-${randomUUID()}`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'Deletion Tester', email, password },
  });
  expect(response.status(), await response.text()).toBe(200);
  return { email, password };
}

test('DELETE /api/account rejects unauthenticated callers', async ({ request }) => {
  const response = await request.delete(`${API_URL}/api/account`, {
    headers: { origin: ORIGIN },
  });
  expect(response.status()).toBe(401);
});

test('deleting an account removes its server data and ends the session', async ({ request }) => {
  const { email, password } = await signUp(request, 'lifecycle');

  // Persist a real progress snapshot first so there is something to delete.
  const put = await request.put(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
    data: {
      progress: {
        version: 2,
        xp: 42,
        streak: 3,
        lastActiveDate: null,
        todayDate: '2026-11-24',
        todayXp: 42,
        completed: {},
        lastCourseId: 'hi-starter',
        lastLessonId: 'hi-starter-u1-l1',
        srs: {},
        activity: {},
        dailyGoal: 50,
        timeZone: null,
        equippedCosmetic: null,
      },
    },
  });
  expect(put.status(), await put.text()).toBe(200);

  const before = await request.get(`${API_URL}/api/progress`, { headers: { origin: ORIGIN } });
  expect(before.status()).toBe(200);
  expect((await before.json()).progress.xp).toBe(42);

  const deletion = await request.delete(`${API_URL}/api/account`, { headers: { origin: ORIGIN } });
  expect(deletion.status(), await deletion.text()).toBe(204);

  // The old session must no longer read any user-owned row.
  const after = await request.get(`${API_URL}/api/progress`, { headers: { origin: ORIGIN } });
  expect(after.status()).toBe(401);

  // And the account itself must be gone: sign-in with the same credentials fails.
  const signIn = await request.post(`${API_URL}/api/auth/sign-in/email`, {
    headers: { origin: ORIGIN },
    data: { email, password },
  });
  expect([400, 401]).toContain(signIn.status());
});
