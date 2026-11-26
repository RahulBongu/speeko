import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const COURSE_ID = 'hi-starter';
const DAY = 86_400_000;

function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

interface SeedCard {
  skillId: string;
  box: number;
  dueAt: number;
  lapses: number;
}

interface SeedOptions {
  completed?: string[];
  srs?: Record<string, SeedCard>;
  xp?: number;
  todayXp?: number;
}

/** Seeds a v2 snapshot so the practice hub has a real, deterministic history. */
async function seedProgress(page: Page, options: SeedOptions = {}): Promise<void> {
  const completedLessons = options.completed ?? [];
  const completed: Record<string, unknown> = {};
  for (const lessonId of completedLessons) {
    completed[`${COURSE_ID}:${lessonId}`] = {
      courseId: COURSE_ID,
      lessonId,
      completedAt: new Date().toISOString(),
      accuracy: 1,
      xp: 10,
    };
  }
  const today = localDateKey();
  const snapshot = {
    version: 2,
    xp: options.xp ?? 40,
    streak: 2,
    lastActiveDate: today,
    todayDate: today,
    todayXp: options.todayXp ?? 10,
    completed,
    lastCourseId: COURSE_ID,
    lastLessonId: completedLessons.at(-1) ?? null,
    srs: options.srs ?? {},
    dailyGoal: 50,
    timeZone: null,
  };
  await page.addInitScript((value) => {
    window.localStorage.setItem('speeko.progress.v2', JSON.stringify(value));
  }, snapshot);
}

/** The unit-2 first lesson: three chooseMeaning exercises (एक, दो, तीन). */
const UNIT_2_SKILLS = { one: 'hi:एक', two: 'hi:दो', three: 'hi:तीन' } as const;

function unitTwoCards(now = Date.now()): Record<string, SeedCard> {
  return {
    [UNIT_2_SKILLS.one]: {
      skillId: UNIT_2_SKILLS.one,
      box: 2,
      dueAt: now - DAY,
      lapses: 0,
    },
    [UNIT_2_SKILLS.two]: {
      skillId: UNIT_2_SKILLS.two,
      box: 1,
      dueAt: now + DAY,
      lapses: 2,
    },
    [UNIT_2_SKILLS.three]: {
      skillId: UNIT_2_SKILLS.three,
      box: 4,
      dueAt: now + 4 * DAY,
      lapses: 0,
    },
  };
}

async function screenshot(
  page: Page,
  testInfo: { project: { name: string } },
  name: string,
): Promise<void> {
  const dir = path.join('test-results', 'screenshots', testInfo.project.name);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name), animations: 'disabled' });
}

async function readProgress(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('speeko.progress.v2');
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  });
}

async function answerChoiceAndContinue(page: Page, word: string, isLast: boolean): Promise<void> {
  await page.getByRole('button', { name: word, exact: true }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Correct!')).toBeVisible();
  await expect(page.getByText('Review scheduled')).toBeVisible();
  await expect(page.getByText(/\+\d+ XP/)).toHaveCount(0);
  await page
    .getByRole('button', { name: isLast ? 'See results' : 'Continue' })
    .click();
}

test('fresh learner sees an honest empty practice hub', async ({ page }) => {
  await page.goto('/practice');
  await expect(page.getByRole('heading', { name: 'Make it stick.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nothing to practice yet' })).toBeVisible();
  await expect(page.getByText(/Finish your first lesson/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Practice trouble words' })).toHaveCount(0);
  await expect(page.getByText(/0 of \d+ units started/)).toBeVisible();
});

test('hub counts only learned cards and unlocks started units', async ({ page }, testInfo) => {
  await seedProgress(page, {
    completed: ['hi-starter-u2-l1'],
    srs: unitTwoCards(),
  });

  await page.goto('/practice');
  await expect(page.getByRole('heading', { name: 'Make it stick.' })).toBeVisible();
  await expect(page.getByText('1 word ready')).toBeVisible();
  await expect(page.getByText(/3 learned words in rotation/)).toBeVisible();
  await expect(page.getByText('1 of 11 units started')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Practice unit 2: Numbers' })).toBeVisible();
  await expect(page.getByText('Finish a lesson to unlock practice')).toHaveCount(10);
  await expect(page.getByRole('link', { name: 'Practice trouble words' })).toBeVisible();
  await screenshot(page, testInfo, 'practice-hub.png');
});

test('due review moves a box forward without awarding XP', async ({ page }) => {
  await seedProgress(page, {
    completed: ['hi-starter-u2-l1'],
    srs: unitTwoCards(),
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/practice');
  await page.getByRole('link', { name: /Review now/ }).click();
  await expect(page).toHaveURL(/\/lesson\/hi-starter\/review$/);
  await answerChoiceAndContinue(page, 'एक', true);
  await expect(page.getByRole('heading', { name: 'Review complete!' })).toBeVisible();
  await expect(page.getByText('Exercises replayed')).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();

  const stored = await readProgress(page);
  expect(stored?.xp).toBe(40);
  expect(stored?.todayXp).toBe(10);
  const cards = stored?.srs as Record<string, SeedCard>;
  expect(cards[UNIT_2_SKILLS.one]?.box).toBe(3);
  expect(cards[UNIT_2_SKILLS.one]?.dueAt).toBeGreaterThan(Date.now());
  const completed = stored?.completed as Record<string, unknown>;
  expect(completed[`${COURSE_ID}:review`]).toBeUndefined();
});

test('trouble words session is practice-only and still schedules reviews', async ({
  page,
}, testInfo) => {
  await seedProgress(page, {
    completed: ['hi-starter-u2-l1'],
    srs: unitTwoCards(),
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/practice');
  await page.getByRole('link', { name: 'Practice trouble words' }).click();
  await expect(page).toHaveURL(/\/lesson\/hi-starter\/practice-trouble$/);
  await answerChoiceAndContinue(page, 'दो', true);
  await expect(page.getByRole('heading', { name: 'Trouble words done!' })).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(page.getByText('×1', { exact: true })).toBeVisible();
  await screenshot(page, testInfo, 'practice-trouble-complete.png');

  const stored = await readProgress(page);
  expect(stored?.xp).toBe(40);
  const cards = stored?.srs as Record<string, SeedCard>;
  expect(cards[UNIT_2_SKILLS.two]?.box).toBe(2);
  expect(cards[UNIT_2_SKILLS.two]?.lapses).toBe(2);
  const completed = stored?.completed as Record<string, unknown>;
  expect(completed[`${COURSE_ID}:practice-trouble`]).toBeUndefined();
});

test('unit practice replays completed lessons without course progress or XP', async ({
  page,
}, testInfo) => {
  await seedProgress(page, {
    completed: ['hi-starter-u2-l1'],
    srs: {},
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/practice');
  await page.getByRole('link', { name: 'Practice unit 2: Numbers' }).click();
  await expect(page).toHaveURL(/\/lesson\/hi-starter\/practice-unit-2$/);

  await answerChoiceAndContinue(page, 'एक', false);
  await answerChoiceAndContinue(page, 'दो', false);
  await answerChoiceAndContinue(page, 'तीन', true);

  await expect(page.getByRole('heading', { name: 'Unit practice complete!' })).toBeVisible();
  await expect(page.getByText('Exercises replayed')).toBeVisible();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(page.getByText('×3', { exact: true })).toBeVisible();
  await screenshot(page, testInfo, 'practice-unit-complete.png');

  const stored = await readProgress(page);
  expect(stored?.xp).toBe(40);
  expect(stored?.todayXp).toBe(10);
  const completed = stored?.completed as Record<string, unknown>;
  expect(Object.keys(completed)).toEqual([`${COURSE_ID}:hi-starter-u2-l1`]);
  const cards = stored?.srs as Record<string, SeedCard>;
  expect(cards[UNIT_2_SKILLS.one]?.box).toBe(1);
  expect(cards[UNIT_2_SKILLS.two]?.box).toBe(1);
  expect(cards[UNIT_2_SKILLS.three]?.box).toBe(1);
});

test('locked unit practice explains itself instead of opening', async ({ page }) => {
  await seedProgress(page, { completed: [], srs: {} });
  await page.goto('/lesson/hi-starter/practice-unit-1');
  await expect(page.getByRole('heading', { name: "We couldn't open that lesson" })).toBeVisible();
  await expect(page.getByText('Finish a lesson in Greetings before practicing it.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to practice' })).toHaveAttribute(
    'href',
    '/practice',
  );
});
