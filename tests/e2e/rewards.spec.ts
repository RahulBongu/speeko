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

async function signUp(request: APIRequestContext, label: string): Promise<string> {
  const email = `rewards-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'Rewards Tester', email, password: 'speeko-test-password' },
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

async function completeFirstLesson(page: Page): Promise<void> {
  await page.goto('/lesson/hi-starter/hi-starter-u1-l1');
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();

  for (let index = 0; index < 2; index += 1) {
    await page.locator('main button[aria-pressed]').first().click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByText(/Correct!|Not quite/)).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
  }

  await page.locator('input[type="text"]').fill('नमस्ते');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText(/Correct!|Not quite/)).toBeVisible();
  await page.getByRole('button', { name: 'See results' }).click();
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible();
}

/** With reduced motion the summary renders final totals immediately. */
async function expectSummaryTotals(page: Page): Promise<void> {
  await expect(page.getByText('+21', { exact: true })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(page.getByText('×3', { exact: true })).toBeVisible();
}

test('lesson completions reject unauthenticated callers', async ({ request }) => {
  const result = await submitAttempt(request, {
    attemptId: uniqueAttemptId('guest'),
    ...FIRST_LESSON,
  });
  expect(result.status).toBe(401);
});

test('server re-grades a lesson, awards once, and rejects attemptId reuse', async ({
  request,
}) => {
  await signUp(request, 'api');
  const attemptId = uniqueAttemptId('api');
  const payload = { attemptId, ...FIRST_LESSON };

  const first = await submitAttempt(request, payload);
  expect(first.status, first.text).toBe(201);
  expect(first.json.duplicate).toBe(false);
  expect(first.json.event.xp).toBe(21);
  expect(first.json.event.accuracy).toBe(1);
  expect(first.json.event.maxCombo).toBe(3);
  expect(first.json.progress.xp).toBe(21);

  const retry = await submitAttempt(request, payload);
  expect(retry.status, retry.text).toBe(200);
  expect(retry.json.duplicate).toBe(true);
  expect(retry.json.event.id).toBe(first.json.event.id);
  expect(retry.json.progress.xp).toBe(21);

  const progress = await request.get(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
  });
  expect(progress.status()).toBe(200);
  expect((await progress.json()).progress.xp).toBe(21);

  const mismatch = await submitAttempt(request, {
    ...payload,
    lessonId: 'hi-starter-u1-l2',
  });
  expect(mismatch.status, mismatch.text).toBe(409);
});

test('server ignores a claimed pass with wrong answers and rejects incomplete attempts', async ({
  request,
}) => {
  await signUp(request, 'regrade');
  const attemptId = uniqueAttemptId('regrade');
  const wrong = FIRST_LESSON.answers.map((answer) =>
    answer.exerciseId === 'hi-starter-u1-l1-e2'
      ? { ...answer, input: { kind: 'choice' as const, index: 1 } }
      : answer,
  );

  const graded = await submitAttempt(request, {
    attemptId,
    courseId: FIRST_LESSON.courseId,
    lessonId: FIRST_LESSON.lessonId,
    answers: wrong,
  });
  expect(graded.status, graded.text).toBe(201);
  expect(graded.json.event.xp).toBe(16);
  expect(graded.json.event.accuracy).toBeCloseTo(2 / 3, 3);
  expect(graded.json.event.heartsLeft).toBe(4);

  const incomplete = await submitAttempt(request, {
    attemptId: uniqueAttemptId('incomplete'),
    courseId: FIRST_LESSON.courseId,
    lessonId: FIRST_LESSON.lessonId,
    answers: FIRST_LESSON.answers.slice(0, 2),
  });
  expect(incomplete.status, incomplete.text).toBe(422);
  expect(incomplete.json.reason).toMatch(/Every exercise/);
});

test('signed-in lesson completion saves the server reward', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signUp(page.request, 'ui');
  await completeFirstLesson(page);
  await expect(page.getByRole('status')).toContainText('Reward saved to your account.');
  await expectSummaryTotals(page);

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('speeko.progress.v2') ?? 'null'),
  );
  expect(stored?.xp).toBe(21);

  const dir = `docs/qa/${testInfo.project.name}`;
  const fs = await import('node:fs');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: `${dir}/lesson-complete-signed-in.png`,
    animations: 'disabled',
  });
});

test('failed reward save offers Retry without double-counting', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signUp(page.request, 'retry');
  await page.route('**/api/lesson-completions', (route) => route.abort());

  await completeFirstLesson(page);
  await expect(page.getByRole('alert').filter({ hasText: 'Reward not saved' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expectSummaryTotals(page);

  const dir = `docs/qa/${testInfo.project.name}`;
  const fs = await import('node:fs');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: `${dir}/lesson-complete-error.png`,
    animations: 'disabled',
  });

  await page.unroute('**/api/lesson-completions');
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('status')).toContainText('Reward saved to your account.');
  await expect(page.getByRole('alert').filter({ hasText: 'Reward not saved' })).toHaveCount(0);

  const progress = await page.request.get(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
  });
  expect(progress.status()).toBe(200);
  expect((await progress.json()).progress.xp).toBe(21);
});
