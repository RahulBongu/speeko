import fs from 'node:fs';
import { expect, test, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const ORIGIN = 'http://localhost:3000';

/**
 * Six distinct lessons, each with correct answers. Phase H grants a lesson gem
 * only on the first completion, so a fixture that replays one lesson can no
 * longer earn gems. Six first completions pay 6 × 5 lesson gems plus the two
 * completed daily quests (20) = 50 gems, which is what the shop tests need.
 */
const LESSONS = [
  {
    courseId: 'hi-starter',
    lessonId: 'hi-starter-u1-l1',
    answers: [
      { exerciseId: 'hi-starter-u1-l1-e1', input: { kind: 'choice', index: 0 }, ms: 1200 },
      { exerciseId: 'hi-starter-u1-l1-e2', input: { kind: 'choice', index: 0 }, ms: 900 },
      { exerciseId: 'hi-starter-u1-l1-e3', input: { kind: 'text', value: 'नमस्ते' }, ms: 2100 },
    ],
  },
  {
    courseId: 'hi-starter',
    lessonId: 'hi-starter-u1-l2',
    answers: [
      { exerciseId: 'hi-starter-u1-l2-e1', input: { kind: 'choice', index: 0 }, ms: 1000 },
      { exerciseId: 'hi-starter-u1-l2-e2', input: { kind: 'choice', index: 0 }, ms: 1000 },
      { exerciseId: 'hi-starter-u1-l2-e3', input: { kind: 'pairs', mismatches: 0 }, ms: 1500 },
    ],
  },
  {
    courseId: 'hi-starter',
    lessonId: 'hi-starter-u2-l1',
    answers: [
      { exerciseId: 'hi-starter-u2-l1-e1', input: { kind: 'choice', index: 0 }, ms: 1200 },
      { exerciseId: 'hi-starter-u2-l1-e2', input: { kind: 'choice', index: 0 }, ms: 900 },
      { exerciseId: 'hi-starter-u2-l1-e3', input: { kind: 'choice', index: 0 }, ms: 1100 },
    ],
  },
  {
    courseId: 'hi-starter',
    lessonId: 'hi-starter-u2-l2',
    answers: [
      { exerciseId: 'hi-starter-u2-l2-e1', input: { kind: 'choice', index: 0 }, ms: 1200 },
      { exerciseId: 'hi-starter-u2-l2-e2', input: { kind: 'choice', index: 0 }, ms: 900 },
    ],
  },
  {
    courseId: 'hi-starter',
    lessonId: 'hi-starter-u3-l1',
    answers: [
      { exerciseId: 'hi-starter-u3-l1-e1', input: { kind: 'choice', index: 0 }, ms: 1200 },
      { exerciseId: 'hi-starter-u3-l1-e2', input: { kind: 'choice', index: 0 }, ms: 900 },
      { exerciseId: 'hi-starter-u3-l1-e3', input: { kind: 'text', value: 'कृपया' }, ms: 2100 },
    ],
  },
  {
    courseId: 'hi-starter',
    lessonId: 'hi-starter-u3-l2',
    answers: [
      { exerciseId: 'hi-starter-u3-l2-e1', input: { kind: 'choice', index: 0 }, ms: 1200 },
      // e3 listenChoose is excluded: its audio file is empty in the draft.
      { exerciseId: 'hi-starter-u3-l2-e2', input: { kind: 'text', value: 'सुप्रभात' }, ms: 2100 },
    ],
  },
];

function uniqueAttemptId(label: string): string {
  return `attempt-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function signUp(request: APIRequestContext, label: string): Promise<void> {
  const email = `shop-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'Shop Tester', email, password: 'speeko-test-password' },
  });
  expect(response.status(), await response.text()).toBe(200);
}

async function submitAttempt(
  request: APIRequestContext,
  attemptId: string,
  lesson = LESSONS[0]!,
): Promise<void> {
  const response = await request.post(`${API_URL}/api/lesson-completions`, {
    headers: { origin: ORIGIN },
    data: { attemptId, ...lesson },
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
}

async function earnGems(request: APIRequestContext, count: number, label: string): Promise<void> {
  if (count > LESSONS.length) {
    throw new Error(`The gem fixture has ${LESSONS.length} distinct lessons, not ${count}.`);
  }
  for (let index = 0; index < count; index += 1) {
    await submitAttempt(request, uniqueAttemptId(`${label}-${index}`), LESSONS[index]);
  }
}

test('shop and gems reject unauthenticated callers', async ({ request }) => {
  expect((await request.get(`${API_URL}/api/gems`, { headers: { origin: ORIGIN } })).status()).toBe(401);
  expect((await request.get(`${API_URL}/api/shop`, { headers: { origin: ORIGIN } })).status()).toBe(401);
  const purchase = await request.post(`${API_URL}/api/shop/purchase`, {
    headers: { origin: ORIGIN },
    data: { itemId: 'fox-scarf', requestId: 'unauth-request' },
  });
  expect(purchase.status()).toBe(401);
});

test('insufficient gems state is returned honestly', async ({ request }) => {
  await signUp(request, 'poor');
  const shop = await request.get(`${API_URL}/api/shop`, { headers: { origin: ORIGIN } });
  expect(shop.status()).toBe(200);
  expect((await shop.json()).balance).toBe(0);

  const purchase = await request.post(`${API_URL}/api/shop/purchase`, {
    headers: { origin: ORIGIN },
    data: { itemId: 'fox-scarf', requestId: uniqueAttemptId('poor') },
  });
  expect(purchase.status()).toBe(409);
  expect((await purchase.json()).error).toMatch(/Not enough gems/);
});

test('a purchase spends gems once and records ownership', async ({ request }) => {
  await signUp(request, 'buyer');
  await earnGems(request, 6, 'buyer'); // 6 distinct lessons (30) + 2 daily quests (20) = 50

  const beforeShop = await request.get(`${API_URL}/api/shop`, { headers: { origin: ORIGIN } });
  expect(beforeShop.status()).toBe(200);
  const before = await beforeShop.json();
  expect(before.balance).toBe(50);
  const scarf = before.items.find((item: any) => item.id === 'fox-scarf');
  expect(scarf.canAfford).toBe(true);
  expect(scarf.owned).toBe(false);

  const requestId = uniqueAttemptId('scarf');
  const purchase = await request.post(`${API_URL}/api/shop/purchase`, {
    headers: { origin: ORIGIN },
    data: { itemId: 'fox-scarf', requestId },
  });
  expect(purchase.status(), await purchase.text()).toBe(200);
  const bought = await purchase.json();
  expect(bought.duplicate).toBe(false);
  expect(bought.balance).toBe(20);
  expect(bought.item.owned).toBe(true);

  // Replay with the same key must not charge again.
  const replay = await request.post(`${API_URL}/api/shop/purchase`, {
    headers: { origin: ORIGIN },
    data: { itemId: 'fox-scarf', requestId },
  });
  expect(replay.status(), await replay.text()).toBe(200);
  const replayed = await replay.json();
  expect(replayed.duplicate).toBe(true);
  expect(replayed.balance).toBe(20);

  const afterShop = await request.get(`${API_URL}/api/shop`, { headers: { origin: ORIGIN } });
  const after = await afterShop.json();
  const ownedScarf = after.items.find((item: any) => item.id === 'fox-scarf');
  expect(ownedScarf.owned).toBe(true);
  expect(ownedScarf.quantity).toBe(1);

  // Buying again is rejected as already owned.
  const second = await request.post(`${API_URL}/api/shop/purchase`, {
    headers: { origin: ORIGIN },
    data: { itemId: 'fox-scarf', requestId: uniqueAttemptId('scarf-again') },
  });
  expect(second.status()).toBe(409);
  expect((await second.json()).error).toMatch(/already own/);
});

test('concurrent purchases cannot double-spend', async ({ request }) => {
  await signUp(request, 'race');
  await earnGems(request, 6, 'race'); // 50 gems; the 30-gem scarf can be bought once

  const requestIdA = uniqueAttemptId('race-a');
  const requestIdB = uniqueAttemptId('race-b');
  const [first, second] = await Promise.all([
    request.post(`${API_URL}/api/shop/purchase`, {
      headers: { origin: ORIGIN },
      data: { itemId: 'fox-scarf', requestId: requestIdA },
    }),
    request.post(`${API_URL}/api/shop/purchase`, {
      headers: { origin: ORIGIN },
      data: { itemId: 'fox-scarf', requestId: requestIdB },
    }),
  ]);

  const statuses = [first.status(), second.status()].sort();
  expect(statuses).toEqual([200, 409]);

  const gems = await request.get(`${API_URL}/api/gems`, { headers: { origin: ORIGIN } });
  expect((await gems.json()).balance).toBe(20);
});

test('an equipped cosmetic requires ownership, persists, and can be removed', async ({ request }) => {
  await signUp(request, 'cosmetic');
  await earnGems(request, 6, 'cosmetic');

  const beforePurchase = await request.get(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
  });
  expect(beforePurchase.status()).toBe(200);
  const unowned = (await beforePurchase.json()).progress;
  unowned.equippedCosmetic = 'scarf';

  const rejected = await request.put(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
    data: { progress: unowned },
  });
  expect(rejected.status()).toBe(409);
  expect((await rejected.json()).error).toMatch(/do not own/i);

  const purchase = await request.post(`${API_URL}/api/shop/purchase`, {
    headers: { origin: ORIGIN },
    data: { itemId: 'fox-scarf', requestId: uniqueAttemptId('cosmetic') },
  });
  expect(purchase.status(), await purchase.text()).toBe(200);

  const progressResponse = await request.get(`${API_URL}/api/progress`, { headers: { origin: ORIGIN } });
  expect(progressResponse.status()).toBe(200);
  const progress = (await progressResponse.json()).progress;
  progress.equippedCosmetic = 'scarf';

  const saved = await request.put(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
    data: { progress },
  });
  expect(saved.status(), await saved.text()).toBe(200);
  expect((await saved.json()).progress.equippedCosmetic).toBe('scarf');

  const reloaded = await request.get(`${API_URL}/api/progress`, { headers: { origin: ORIGIN } });
  expect((await reloaded.json()).progress.equippedCosmetic).toBe('scarf');

  // An explicit null un-equips, even though lesson history is unchanged.
  const current = (await reloaded.json()).progress;
  current.equippedCosmetic = null;
  const removed = await request.put(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
    data: { progress: current },
  });
  expect(removed.status(), await removed.text()).toBe(200);
  expect((await removed.json()).progress.equippedCosmetic).toBeNull();

  const afterRemoval = await request.get(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
  });
  expect((await afterRemoval.json()).progress.equippedCosmetic).toBeNull();
});

test('a streak freeze purchase adds a freeze credit', async ({ request }) => {
  await signUp(request, 'freeze');
  await earnGems(request, 6, 'freeze'); // 50 gems, exactly the freeze price

  const purchase = await request.post(`${API_URL}/api/shop/purchase`, {
    headers: { origin: ORIGIN },
    data: { itemId: 'streak-freeze', requestId: uniqueAttemptId('freeze') },
  });
  expect(purchase.status(), await purchase.text()).toBe(200);
  const body = await purchase.json();
  expect(body.freezeCredits).toBe(1);

  const gems = await request.get(`${API_URL}/api/gems`, { headers: { origin: ORIGIN } });
  expect((await gems.json()).freezeCredits).toBe(1);
});