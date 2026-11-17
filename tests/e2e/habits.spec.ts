import fs from 'node:fs';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

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
  return `attempt-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

async function signUp(request: APIRequestContext, label: string): Promise<string> {
  const email = `habits-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'Habits Tester', email, password: 'speeko-test-password' },
  });
  expect(response.status(), await response.text()).toBe(200);
  return email;
}

async function submitAttempt(
  request: APIRequestContext,
  body: Record<string, unknown>,
): Promise<{ status: number; json: any; text: string }> {
  const response = await request.post(`${API_URL}/api/lesson-completions`, {
    headers: { origin: ORIGIN },
    data: body,
  });
  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Leave null for non-JSON error bodies.
  }
  return { status: response.status(), json, text };
}

async function getHabits(request: APIRequestContext): Promise<any> {
  const response = await request.get(`${API_URL}/api/habits`, {
    headers: { origin: ORIGIN },
  });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).habits;
}

async function openHabits(page: Page): Promise<void> {
  await page.goto('/habits');
  await expect(page.getByRole('heading', { name: 'One day at a time.' })).toBeVisible();
}

function screenshot(page: Page, testInfo: { project: { name: string } }, name: string): Promise<void> {
  const dir = `docs/qa/${testInfo.project.name}`;
  fs.mkdirSync(dir, { recursive: true });
  return page.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled' });
}

test('habits reject unauthenticated callers', async ({ request }) => {
  const response = await request.get(`${API_URL}/api/habits`, {
    headers: { origin: ORIGIN },
  });
  expect(response.status()).toBe(401);
});

test('habit totals derive from lesson events and duplicate retries never double-count', async ({
  request,
}) => {
  await signUp(request, 'events');
  const attemptId = uniqueAttemptId('events');
  const payload = { attemptId, ...FIRST_LESSON };

  const first = await submitAttempt(request, payload);
  expect(first.status, first.text).toBe(201);
  const xp = first.json.event.xp;

  const before = await getHabits(request);
  expect(before.totals.lessons).toBe(1);
  expect(before.totals.xp).toBe(xp);
  expect(before.totals.activeDays).toBe(1);
  expect(before.today.xp).toBe(xp);
  expect(before.today.lessons).toBe(1);
  expect(before.streak.current).toBe(1);
  expect(before.quests.find((quest: any) => quest.id === 'daily-goal').progress).toBe(
    Math.min(xp, before.dailyGoal),
  );
  expect(before.quests.find((quest: any) => quest.id === 'daily-lessons').progress).toBe(1);
  expect(before.quests.find((quest: any) => quest.id === 'weekly-lessons').progress).toBe(1);
  const activeDays = before.calendar.filter((day: any) => day.status === 'active');
  expect(activeDays).toHaveLength(1);
  expect(activeDays[0].day).toBe(before.asOfDay);

  const retry = await submitAttempt(request, payload);
  expect(retry.status, retry.text).toBe(200);
  expect(retry.json.duplicate).toBe(true);

  const after = await getHabits(request);
  expect(after.totals).toEqual(before.totals);
  expect(after.today).toEqual(before.today);
  expect(after.quests.map((quest: any) => quest.progress)).toEqual(
    before.quests.map((quest: any) => quest.progress),
  );
  expect(after.calendar).toEqual(before.calendar);
});

test('signed-in habits page shows verified history and survives reload without double-counting', async ({
  page,
}, testInfo) => {
  await signUp(page.request, 'page');
  const attempt = await submitAttempt(page.request, {
    attemptId: uniqueAttemptId('page'),
    ...FIRST_LESSON,
  });
  expect(attempt.status, attempt.text).toBe(201);
  const xp = attempt.json.event.xp;

  await openHabits(page);
  await expect(page.getByText('Verified server history')).toBeVisible();
  await expect(page.getByText(`${xp} / 50`).first()).toBeVisible();
  await screenshot(page, testInfo, 'habits-signed-in');

  const before = await getHabits(page.request);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'One day at a time.' })).toBeVisible();
  await expect(page.getByText(`${xp} / 50`).first()).toBeVisible();

  const after = await getHabits(page.request);
  expect(after.totals).toEqual(before.totals);
  expect(after.today).toEqual(before.today);
});

test('goal picker saves to the device and the account', async ({ page }, testInfo) => {
  await signUp(page.request, 'goal');
  await openHabits(page);

  const goal = page.getByRole('button', { name: /80\s*XP/i });
  await expect(goal).toHaveAttribute('aria-pressed', 'false');
  await goal.click();
  await expect(page.getByText('Goal saved and synced.')).toBeVisible();
  await expect(goal).toHaveAttribute('aria-pressed', 'true');

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('speeko.progress.v2') ?? 'null'),
  );
  expect(stored?.dailyGoal).toBe(80);

  const progress = await page.request.get(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
  });
  expect(progress.status()).toBe(200);
  expect((await progress.json()).progress.dailyGoal).toBe(80);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'One day at a time.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /80\s*XP/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await screenshot(page, testInfo, 'habits-goal');
});

test('guest habits derive from device activity and label their source', async ({ page }, testInfo) => {
  const today = localDateKey();
  const activity: Record<string, { xp: number; lessons: number }> = {};
  const completed: Record<string, unknown> = {};
  const xpByDay = [12, 24, 36, 48, 60, 15, 40];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const day = localDateKey(date);
    const xp = xpByDay[6 - index] ?? 10;
    activity[day] = { xp, lessons: 1 };
    completed[`guest-history:guest-${day}`] = {
      courseId: 'guest-history',
      lessonId: `guest-${day}`,
      completedAt: date.toISOString(),
      accuracy: 1,
      xp,
    };
  }

  const snapshot = {
    version: 2,
    xp: 235,
    streak: 7,
    lastActiveDate: today,
    todayDate: today,
    todayXp: 40,
    completed,
    lastCourseId: 'hi-starter',
    lastLessonId: 'hi-starter-u1-l1',
    srs: {},
    activity,
    dailyGoal: 50,
    timeZone: null,
  };

  await page.addInitScript((progress) => {
    try {
      window.localStorage.setItem('speeko.progress.v2', JSON.stringify(progress));
    } catch {
      // about:blank has no storage; the next real document will.
    }
  }, snapshot);

  await openHabits(page);
  await expect(page.getByText('This device only')).toBeVisible();
  await expect(page.getByText('7 days in a row', { exact: false })).toBeVisible();
  await expect(page.getByText('1 of 2')).toBeVisible();
  await expect(page.getByText('40 / 50').first()).toBeVisible();
  await expect(page.getByText('5 of 10')).toBeVisible();
  await screenshot(page, testInfo, 'habits-guest');
});
