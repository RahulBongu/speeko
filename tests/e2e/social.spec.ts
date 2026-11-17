import { expect, test, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const ORIGIN = 'http://localhost:3000';

async function signUp(request: APIRequestContext, label: string): Promise<void> {
  const email = `social-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: `Social ${label}`, email, password: 'speeko-test-password' },
  });
  expect(response.status(), await response.text()).toBe(200);
}

async function me(request: APIRequestContext): Promise<{ username: string }> {
  const response = await request.get(`${API_URL}/api/profiles/me`, { headers: { origin: ORIGIN } });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as { username: string };
}

test('social endpoints reject unauthenticated callers', async ({ request }) => {
  expect((await request.get(`${API_URL}/api/leagues`, { headers: { origin: ORIGIN } })).status()).toBe(401);
  expect((await request.get(`${API_URL}/api/profiles/me`, { headers: { origin: ORIGIN } })).status()).toBe(401);
  expect((await request.get(`${API_URL}/api/profiles/search?q=ab`, { headers: { origin: ORIGIN } })).status()).toBe(401);
});

test('profiles are created on demand and follow works by username', async ({ request }) => {
  await signUp(request, 'a');
  const profileA = await me(request);
  expect(profileA.username).toBeTruthy();

  // Create the second account in a separate context by signing out? request shares cookies,
  // so sign up again overwrites the session cookie.
  await signUp(request, 'b');
  const profileB = await me(request);
  expect(profileB.username).not.toBe(profileA.username);

  // Sign back in as A is not possible without password login; use B's session to follow A.
  const search = await request.get(`${API_URL}/api/profiles/search?q=${profileA.username}`, {
    headers: { origin: ORIGIN },
  });
  expect(search.status()).toBe(200);
  const found = (await search.json()).results as { username: string }[];
  expect(found.some((entry) => entry.username === profileA.username)).toBe(true);

  const follow = await request.post(`${API_URL}/api/follows`, {
    headers: { origin: ORIGIN },
    data: { username: profileA.username },
  });
  expect(follow.status(), await follow.text()).toBe(200);
  expect((await follow.json()).following).toBe(true);

  const profile = await request.get(`${API_URL}/api/profiles/${profileA.username}`, {
    headers: { origin: ORIGIN },
  });
  expect(profile.status()).toBe(200);
  const body = await profile.json();
  expect(body.isFollowing).toBe(true);
  expect(body.followers).toBe(1);

  const unfollow = await request.delete(`${API_URL}/api/follows`, {
    headers: { origin: ORIGIN },
    data: { username: profileA.username },
  });
  expect(unfollow.status(), await unfollow.text()).toBe(200);
  expect((await unfollow.json()).following).toBe(false);
});

test('weekly leagues report an honest early-community state', async ({ request }) => {
  await signUp(request, 'league');
  const completion = await request.post(`${API_URL}/api/lesson-completions`, {
    headers: { origin: ORIGIN },
    data: {
      attemptId: `attempt-league-${Date.now()}`,
      courseId: 'hi-starter',
      lessonId: 'hi-starter-u1-l1',
      answers: [
        { exerciseId: 'hi-starter-u1-l1-e1', input: { kind: 'choice', index: 0 }, ms: 1200 },
        { exerciseId: 'hi-starter-u1-l1-e2', input: { kind: 'choice', index: 0 }, ms: 900 },
        { exerciseId: 'hi-starter-u1-l1-e3', input: { kind: 'text', value: 'नमस्ते' }, ms: 2100 },
      ],
    },
  });
  // The standings below only prove anything if a reward was actually minted.
  expect(completion.status(), await completion.text()).toBe(201);

  const leagues = await request.get(`${API_URL}/api/leagues`, { headers: { origin: ORIGIN } });
  expect(leagues.status(), await leagues.text()).toBe(200);
  const body = await leagues.json();
  expect(body.activeUsers).toBeGreaterThanOrEqual(1);
  expect(body.minimumPlayers).toBe(10);
  expect(body.standings.length).toBe(body.activeUsers);
  expect(body.earlyCommunity).toBe(body.activeUsers < body.minimumPlayers);
  expect(body.standings[0].weeklyXp).toBeGreaterThan(0);
});