import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

async function screenshot(page: Page, testInfo: { project: { name: string } }, name: string) {
  const dir = path.join('test-results', 'screenshots', testInfo.project.name);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, name),
    animations: 'disabled',
  });
}

test('new guest reaches the first lesson in six taps', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('link', { name: /start learning/i }).first().click();
  await expect(page).toHaveURL(/\/onboarding\/language$/);

  await page.getByRole('button', { name: /हिन्दी/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/motivation$/);

  await page.getByRole('button', { name: /Travel/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/level$/);

  await page.getByRole('button', { name: /starting from zero/i }).click();
  await expect(page).toHaveURL(/\/onboarding\/daily-goal$/);

  await page.getByRole('button', { name: /Regular/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/commitment$/);

  await page.getByRole('button', { name: /Every day/ }).click();
  await expect(page).toHaveURL(
    /\/lesson\/hi-starter\/hi-starter-u1-l1$/,
  );
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await screenshot(page, testInfo, 'onboarding-first-lesson.png');
});

test('onboarding steps are direct URLs and browser Back works', async ({ page }) => {
  await page.goto('/onboarding/level');
  await expect(page).toHaveURL(/\/onboarding\/language$/);

  await page.getByRole('button', { name: /বাংলা/ }).click();
  await expect(page).toHaveURL(/\/onboarding\/motivation$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/onboarding\/language$/);
  await expect(page.getByRole('button', { name: /বাংলা/ })).toHaveAttribute('aria-pressed', 'true');
});

test('course switcher routes to another path and remembers it', async ({ page }) => {
  await page.goto('/learn/hi-starter');
  const switcher = page.getByLabel('Switch course');
  await expect(switcher).toBeEnabled();
  await switcher.selectOption('bn-starter');
  await expect(page).toHaveURL(/\/learn\/bn-starter$/);
  await expect(page.getByRole('heading', { name: 'বাংলা — Starter' })).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('speeko.progress.v2') ?? 'null'),
  );
  expect(stored?.lastCourseId).toBe('bn-starter');
});

test('unit chest opens the guidebook with real target items', async ({ page }, testInfo) => {
  await page.goto('/learn/hi-starter');
  await page.locator('a[href="/learn/hi-starter/guidebook/1"]').click();
  await expect(page).toHaveURL(/\/learn\/hi-starter\/guidebook\/1$/);
  await expect(page.getByRole('heading', { name: 'Greetings' })).toBeVisible();
  await expect(page.getByText('Words and phrases in this unit')).toBeVisible();
  await expect(page.getByText('नमस्ते').first()).toBeVisible();
  await screenshot(page, testInfo, 'guidebook-hi-starter-unit-1.png');
});

test('checkpoint stays locked until prior units are complete', async ({ page }) => {
  await page.goto('/learn/hi-starter');
  await expect(page.getByText('Checkpoint').first()).toBeVisible();
  await expect(page.getByText('Finish units 1–2 first').first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Checkpoint/ }).first(),
  ).toHaveCount(0);
});

test('checkpoint unlocks and opens a practice-only lesson', async ({ page }) => {
  const today = localDateKey();
  const completed: Record<string, unknown> = {};
  for (const lessonId of [
    'hi-starter-u1-l1',
    'hi-starter-u1-l2',
    'hi-starter-u2-l1',
    'hi-starter-u2-l2',
  ]) {
    completed[`hi-starter:${lessonId}`] = {
      courseId: 'hi-starter',
      lessonId,
      completedAt: new Date().toISOString(),
      accuracy: 1,
      xp: 10,
    };
  }
  const snapshot = {
    version: 2,
    xp: 40,
    streak: 2,
    lastActiveDate: today,
    todayDate: today,
    todayXp: 0,
    completed,
    lastCourseId: 'hi-starter',
    lastLessonId: 'hi-starter-u2-l2',
    srs: {},
    dailyGoal: 50,
    timeZone: null,
  };

  await page.addInitScript((value) => {
    window.localStorage.setItem('speeko.progress.v2', JSON.stringify(value));
  }, snapshot);

  await page.goto('/learn/hi-starter');
  const checkpoint = page.getByRole('link', { name: /Checkpoint/ }).first();
  await expect(checkpoint).toBeVisible();
  await checkpoint.click();
  await expect(page).toHaveURL(/\/lesson\/hi-starter\/checkpoint-unit-2$/);
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();
});
