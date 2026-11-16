import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';

interface RouteCase {
  name: string;
  path: string;
  ready: (page: Page) => Locator;
}

const ROUTES: RouteCase[] = [
  { name: 'home', path: '/', ready: (page) => page.getByRole('link', { name: /start learning/i }).first() },
  {
    name: 'learn',
    path: '/learn',
    ready: (page) => page.locator('a[href="/learn/hi-starter"]').first(),
  },
  {
    name: 'course-hi-starter',
    path: '/learn/hi-starter',
    ready: (page) =>
      page.locator('a[href="/lesson/hi-starter/hi-starter-u1-l1"]').first(),
  },
  {
    name: 'lesson-hi-starter-u1-l1',
    path: '/lesson/hi-starter/hi-starter-u1-l1',
    ready: (page) => page.getByRole('button', { name: 'Check' }),
  },
  {
    name: 'practice',
    path: '/practice',
    ready: (page) => page.getByRole('heading', { name: 'Make it stick.' }),
  },
  {
    name: 'shop',
    path: '/shop',
    ready: (page) => page.getByRole('heading', { name: 'The shop needs an account' }),
  },
  {
    name: 'leagues',
    path: '/leagues',
    ready: (page) => page.getByRole('heading', { name: 'Leagues need an account' }),
  },
  {
    name: 'people',
    path: '/people',
    ready: (page) => page.getByRole('heading', { name: 'People need an account' }),
  },
  {
    name: 'stories',
    path: '/stories',
    ready: (page) => page.getByRole('heading', { name: 'Stories are coming' }),
  },
  {
    name: 'conversation',
    path: '/conversation',
    ready: (page) => page.getByRole('heading', { name: 'Conversation practice' }),
  },
  {
    name: 'habits',
    path: '/habits',
    ready: (page) => page.getByRole('heading', { name: 'One day at a time.' }),
  },
  { name: 'sign-in', path: '/sign-in', ready: (page) => page.locator('h1').first() },
  { name: 'sign-up', path: '/sign-up', ready: (page) => page.locator('h1').first() },
  {
    name: 'onboarding-language',
    path: '/onboarding/language',
    ready: (page) => page.getByRole('heading', { name: 'Which language calls to you?' }),
  },
  {
    name: 'guidebook-hi-starter-unit-1',
    path: '/learn/hi-starter/guidebook/1',
    ready: (page) => page.getByText('Words and phrases in this unit'),
  },
  {
    name: 'account',
    path: '/account',
    ready: (page) => page.getByRole('heading', { name: 'You are learning as a guest' }),
  },
  {
    name: 'studio',
    path: '/studio',
    ready: (page) => page.locator('a[href="/studio/hi-starter"]').first(),
  },
  {
    name: 'studio-hi-starter',
    path: '/studio/hi-starter',
    ready: (page) => page.getByText(/Valid course/),
  },
];

function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

for (const route of ROUTES) {
  test(`smoke + screenshot: ${route.name}`, async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${route.path} HTTP status`).toBeLessThan(400);
    await expect(route.ready(page)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const dir = path.join('docs', 'qa', testInfo.project.name);
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, `${route.name}.png`),
      animations: 'disabled',
    });

    expect(pageErrors, 'uncaught page errors').toEqual([]);
    expect(consoleErrors, 'console errors').toEqual([]);
  });
}

test('reads legacy v1 guest progress without rewriting it', async ({ page }) => {
  const today = localDateKey();
  const legacy = {
    version: 1,
    xp: 42,
    streak: 1,
    lastActiveDate: today,
    todayDate: today,
    todayXp: 12,
    completed: {
      'hi-starter:hi-starter-u1-l1': {
        courseId: 'hi-starter',
        lessonId: 'hi-starter-u1-l1',
        completedAt: new Date().toISOString(),
        accuracy: 0.8,
        xp: 12,
      },
    },
    lastCourseId: 'hi-starter',
    lastLessonId: 'hi-starter-u1-l1',
    srs: {},
  };

  await page.addInitScript((snapshot) => {
    try {
      window.localStorage.setItem('speeko.progress.v1', JSON.stringify(snapshot));
    } catch {
      // about:blank has no storage; the next real document will.
    }
  }, legacy);

  await page.goto('/learn/hi-starter');
  await expect(
    page.locator('a[href="/lesson/hi-starter/hi-starter-u1-l2"]').first(),
  ).toBeVisible();

  const stored = await page.evaluate(() => ({
    v1: window.localStorage.getItem('speeko.progress.v1'),
    v2: window.localStorage.getItem('speeko.progress.v2'),
  }));
  expect(stored.v1).toBe(JSON.stringify(legacy));
  expect(stored.v2).toBeNull();
});

test('guest can answer the first exercise and sees feedback', async ({ page }, testInfo) => {
  await page.goto('/lesson/hi-starter/hi-starter-u1-l1');
  const check = page.getByRole('button', { name: 'Check' });
  await expect(check).toBeVisible();
  await expect(check).toBeDisabled();

  await page.locator('main button[aria-pressed]').first().click();
  await expect(check).toBeEnabled();
  await check.click();

  await expect(page.getByText(/Correct!|Not quite/)).toBeVisible();
  const dir = path.join('docs', 'qa', testInfo.project.name);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, 'lesson-feedback.png'),
    animations: 'disabled',
  });
});
