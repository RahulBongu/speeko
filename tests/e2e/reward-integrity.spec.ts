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

const SECOND_LESSON = {
  courseId: 'hi-starter',
  lessonId: 'hi-starter-u1-l2',
  answers: [
    {
      exerciseId: 'hi-starter-u1-l2-e1',
      input: { kind: 'choice', index: 0 },
      ms: 1000,
    },
    {
      exerciseId: 'hi-starter-u1-l2-e2',
      input: { kind: 'choice', index: 0 },
      ms: 1000,
    },
    {
      exerciseId: 'hi-starter-u1-l2-e3',
      input: { kind: 'pairs', mismatches: 0 },
      ms: 1500,
    },
  ],
};

function uniqueAttemptId(label: string): string {
  return `attempt-reward-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function signUp(request: APIRequestContext, label: string): Promise<void> {
  const email = `reward-integrity-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.com`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'Reward Integrity Tester', email, password: 'speeko-test-password' },
  });
  expect(response.status(), await response.text()).toBe(200);
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

async function profile(request: APIRequestContext): Promise<any> {
  const response = await request.get(`${API_URL}/api/profiles/me`, {
    headers: { origin: ORIGIN },
  });
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
}

async function gems(request: APIRequestContext): Promise<any> {
  const response = await request.get(`${API_URL}/api/gems`, {
    headers: { origin: ORIGIN },
  });
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
}

async function habits(request: APIRequestContext): Promise<any> {
  const response = await request.get(`${API_URL}/api/habits`, {
    headers: { origin: ORIGIN },
  });
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()).habits;
}

function lessonGems(body: any): any[] {
  return (body.ledger as any[]).filter((entry) => entry.reason === 'lesson');
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

/** With reduced motion the summary renders final totals immediately. */
async function completeLesson(page: Page, lesson = FIRST_LESSON): Promise<void> {
  await page.goto(`/lesson/${lesson.courseId}/${lesson.lessonId}`);
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();

  for (let index = 0; index < 2; index += 1) {
    await page.locator('main button[aria-pressed]').first().click();
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByText(/Correct!|Not quite/)).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
  }

  const textInput = page.locator('input[type="text"]');
  if (await textInput.count()) {
    await textInput.fill('नमस्ते');
  } else {
    // The second lesson ends with a pair board: tap each left item then its
    // right-side match.
    const left = page.getByRole('button', { name: 'Yes', exact: true });
    await left.click();
    await page.getByRole('button', { name: 'हाँ', exact: true }).click();
    const no = page.getByRole('button', { name: 'No', exact: true });
    await no.click();
    await page.getByRole('button', { name: 'नहीं', exact: true }).click();
  }

  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText(/Correct!|Not quite/)).toBeVisible();
  await page.getByRole('button', { name: 'See results' }).click();
}

test('first completion rewards once and a new-attempt replay is practice only', async ({
  request,
}) => {
  await signUp(request, 'replay');

  const first = await submitAttempt(request, {
    attemptId: uniqueAttemptId('first'),
    ...FIRST_LESSON,
  });
  expect(first.status, first.text).toBe(201);
  expect(first.json.duplicate).toBe(false);
  expect(first.json.completion).toEqual({ rewarded: true, xp: 21, gems: 5 });
  expect(first.json.event.xp).toBe(21);
  expect(first.json.progress.xp).toBe(21);

  const afterFirst = await profile(request);
  expect(afterFirst.xp).toBe(21);
  expect(afterFirst.lessons).toBe(1);
  expect(lessonGems(await gems(request))).toHaveLength(1);

  const replay = await submitAttempt(request, {
    attemptId: uniqueAttemptId('replay'),
    ...FIRST_LESSON,
  });
  expect(replay.status, replay.text).toBe(201);
  expect(replay.json.duplicate).toBe(false);
  expect(replay.json.completion).toEqual({ rewarded: false, xp: 0, gems: 0 });
  expect(replay.json.event.xp).toBe(0);
  // The attempt is still fully graded and auditable.
  expect(replay.json.event.accuracy).toBe(1);
  expect(replay.json.event.maxCombo).toBe(3);
  expect(replay.json.progress.xp).toBe(21);

  const afterReplay = await profile(request);
  expect(afterReplay.xp).toBe(21);
  expect(afterReplay.lessons).toBe(1);
  const gemBody = await gems(request);
  expect(lessonGems(gemBody)).toHaveLength(1);
  expect(gemBody.balance).toBe(5);

  // Practice remains activity for streaks, but it does not complete quests or
  // add lifetime XP/lessons.
  const afterReplayHabits = await habits(request);
  expect(afterReplayHabits.totals).toMatchObject({ xp: 21, lessons: 2, activeDays: 1 });
  expect(afterReplayHabits.quests.map((quest: any) => quest.progress)).toEqual([21, 1, 1]);

  // A different lesson legitimately earns its own first-completion reward.
  const second = await submitAttempt(request, {
    attemptId: uniqueAttemptId('second'),
    ...SECOND_LESSON,
  });
  expect(second.status, second.text).toBe(201);
  expect(second.json.completion).toEqual({ rewarded: true, xp: 20, gems: 5 });

  const afterSecond = await profile(request);
  expect(afterSecond.xp).toBe(41);
  expect(afterSecond.lessons).toBe(2);
  const afterSecondGems = await gems(request);
  expect(lessonGems(afterSecondGems)).toHaveLength(2);
  // Two lesson gems plus the now-complete two-lesson daily quest.
  expect(afterSecondGems.balance).toBe(20);
});

test('retrying the same attempt is idempotent for rewards', async ({ request }) => {
  await signUp(request, 'retry');
  const attemptId = uniqueAttemptId('same');
  const payload = { attemptId, ...FIRST_LESSON };

  const first = await submitAttempt(request, payload);
  expect(first.status, first.text).toBe(201);
  expect(first.json.completion.rewarded).toBe(true);

  const retry = await submitAttempt(request, payload);
  expect(retry.status, retry.text).toBe(200);
  expect(retry.json.duplicate).toBe(true);
  expect(retry.json.event.id).toBe(first.json.event.id);
  expect(retry.json.completion).toEqual({ rewarded: true, xp: 21, gems: 5 });

  expect((await profile(request)).xp).toBe(21);
  expect(lessonGems(await gems(request))).toHaveLength(1);
  expect((await habits(request)).totals.lessons).toBe(1);
});

test('concurrent new attempts can claim the lesson reward only once', async ({ request }) => {
  await signUp(request, 'race-first');

  const results = await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      submitAttempt(request, {
        attemptId: uniqueAttemptId(`race-first-${index}`),
        ...FIRST_LESSON,
      }),
    ),
  );

  for (const result of results) {
    expect(result.status, result.text).toBe(201);
    expect(result.json.duplicate).toBe(false);
  }

  const rewarded = results.filter((result) => result.json.completion.rewarded);
  expect(rewarded).toHaveLength(1);
  expect(rewarded[0]?.json.event.xp).toBe(21);
  expect(results.filter((result) => result.json.event.xp === 21)).toHaveLength(1);
  expect(results.filter((result) => result.json.event.xp !== 21)).toHaveLength(4);

  expect((await profile(request)).xp).toBe(21);
  expect((await profile(request)).lessons).toBe(1);
  expect(lessonGems(await gems(request))).toHaveLength(1);
  expect((await habits(request)).totals).toMatchObject({ xp: 21, lessons: 5 });
});

test('concurrent replays after a completion cannot grant another reward', async ({ request }) => {
  await signUp(request, 'race-replay');
  const first = await submitAttempt(request, {
    attemptId: uniqueAttemptId('race-replay-first'),
    ...FIRST_LESSON,
  });
  expect(first.status, first.text).toBe(201);
  expect(first.json.completion.rewarded).toBe(true);

  const results = await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      submitAttempt(request, {
        attemptId: uniqueAttemptId(`race-replay-${index}`),
        ...FIRST_LESSON,
      }),
    ),
  );

  for (const result of results) {
    expect(result.status, result.text).toBe(201);
    expect(result.json.completion).toEqual({ rewarded: false, xp: 0, gems: 0 });
    expect(result.json.event.xp).toBe(0);
  }

  expect((await profile(request)).xp).toBe(21);
  expect((await profile(request)).lessons).toBe(1);
  expect(lessonGems(await gems(request))).toHaveLength(1);
  expect((await habits(request)).totals).toMatchObject({ xp: 21, lessons: 6 });
});

test('invalid and incomplete attempts never grant a completion reward', async ({ request }) => {
  await signUp(request, 'invalid');

  const incomplete = await submitAttempt(request, {
    attemptId: uniqueAttemptId('incomplete'),
    courseId: FIRST_LESSON.courseId,
    lessonId: FIRST_LESSON.lessonId,
    answers: FIRST_LESSON.answers.slice(0, 2),
  });
  expect(incomplete.status).toBe(422);

  const unknown = await submitAttempt(request, {
    attemptId: uniqueAttemptId('unknown'),
    courseId: FIRST_LESSON.courseId,
    lessonId: FIRST_LESSON.lessonId,
    answers: FIRST_LESSON.answers.map((answer, index) =>
      index === 0 ? { ...answer, exerciseId: 'not-a-real-exercise' } : answer,
    ),
  });
  expect(unknown.status).toBe(422);

  const duplicateAnswer = await submitAttempt(request, {
    attemptId: uniqueAttemptId('duplicate-answer'),
    courseId: FIRST_LESSON.courseId,
    lessonId: FIRST_LESSON.lessonId,
    answers: [FIRST_LESSON.answers[0], FIRST_LESSON.answers[0], FIRST_LESSON.answers[2]],
  });
  expect(duplicateAnswer.status).toBe(422);

  const empty = await submitAttempt(request, {
    attemptId: uniqueAttemptId('empty'),
    courseId: FIRST_LESSON.courseId,
    lessonId: FIRST_LESSON.lessonId,
    answers: [],
  });
  expect(empty.status).toBe(400);

  expect(await profile(request)).toMatchObject({ xp: 0, lessons: 0 });
  expect((await gems(request)).balance).toBe(0);

  // The same valid lesson still pays exactly once afterwards.
  const valid = await submitAttempt(request, {
    attemptId: uniqueAttemptId('valid'),
    ...FIRST_LESSON,
  });
  expect(valid.status, valid.text).toBe(201);
  expect(valid.json.completion).toEqual({ rewarded: true, xp: 21, gems: 5 });
});

test('guest progress migration never mints or duplicates a completion reward', async ({
  request,
}) => {
  await signUp(request, 'migration');

  const completedAt = new Date().toISOString();
  const today = completedAt.slice(0, 10);
  const snapshot = v2Snapshot({
    xp: 21,
    todayXp: 21,
    lastActiveDate: today,
    completed: {
      'hi-starter:hi-starter-u1-l1': {
        courseId: FIRST_LESSON.courseId,
        lessonId: FIRST_LESSON.lessonId,
        completedAt,
        accuracy: 1,
        xp: 21,
      },
    },
  });
  const put = await request.put(`${API_URL}/api/progress`, {
    headers: { origin: ORIGIN },
    data: { progress: snapshot },
  });
  expect(put.status(), await put.text()).toBe(200);

  // Imported device progress is display-only: no gems, no profile rewards.
  expect(await profile(request)).toMatchObject({ xp: 0, lessons: 0 });
  expect((await gems(request)).balance).toBe(0);

  const firstVerified = await submitAttempt(request, {
    attemptId: uniqueAttemptId('migration-first'),
    ...FIRST_LESSON,
  });
  expect(firstVerified.status, firstVerified.text).toBe(201);
  expect(firstVerified.json.completion).toEqual({ rewarded: true, xp: 21, gems: 5 });
  // The device snapshot keeps its local XP plus the one verified completion;
  // the public/reward ledger stays exactly 21.
  expect(firstVerified.json.progress.xp).toBe(42);
  expect(await profile(request)).toMatchObject({ xp: 21, lessons: 1 });
  expect(lessonGems(await gems(request))).toHaveLength(1);

  const replay = await submitAttempt(request, {
    attemptId: uniqueAttemptId('migration-replay'),
    ...FIRST_LESSON,
  });
  expect(replay.status, replay.text).toBe(201);
  expect(replay.json.completion).toEqual({ rewarded: false, xp: 0, gems: 0 });
  expect(replay.json.progress.xp).toBe(42);
  expect(await profile(request)).toMatchObject({ xp: 21, lessons: 1 });
  expect(lessonGems(await gems(request))).toHaveLength(1);
});

test('the lesson summary tells a replay learner it is practice only', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signUp(page.request, 'ui-replay');

  await completeLesson(page);
  await expect(page.getByRole('status')).toContainText('Reward saved to your account.');
  await expect(page.getByText('+21', { exact: true })).toBeVisible();

  await completeLesson(page);
  await expect(page.getByRole('heading', { name: 'Practice complete!' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    'Lesson saved — practice only, no new completion XP.',
  );
  await expect(page.getByText('No new XP', { exact: true })).toBeVisible();

  expect(await profile(page.request)).toMatchObject({ xp: 21, lessons: 1 });
  expect(lessonGems(await gems(page.request))).toHaveLength(1);

  const dir = `docs/qa/${testInfo.project.name}`;
  const fs = await import('node:fs');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: `${dir}/lesson-complete-practice.png`,
    animations: 'disabled',
  });
});
