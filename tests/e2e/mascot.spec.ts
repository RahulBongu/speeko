import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

async function shot(page: Page, project: string, name: string) {
  const dir = path.join('test-results', 'mascot-check', project);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name) });
}

test('single Speeko fox transitions smoothly across lesson states without duplication', async ({
  page,
}, testInfo) => {
  await page.goto('/lesson/hi-starter/hi-starter-u1-l1');
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();

  const fox = page.locator('[data-fox-mascot="true"]');
  const animatedImg = fox.locator('img').first();
  // Exactly one mascot in active lesson screen (brief greeting on load -> settles to idle)
  await expect(fox).toHaveCount(1);
  await expect(fox).toHaveAttribute('data-mascot-state', /greeting|idle/);
  await page.waitForTimeout(1850);
  await expect(fox).toHaveAttribute('data-mascot-state', 'idle');
  await expect(animatedImg).toHaveAttribute('src', '/mascot/clips/idle.webp');
  await expect
    .poll(() => animatedImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await shot(page, testInfo.project.name, '01-idle.png');

  // Selecting an answer moves the fox smoothly into thinking (chin paw + gaze)
  await page.locator('main button[aria-pressed]').first().click();
  await expect(fox).toHaveAttribute('data-mascot-state', 'thinking');
  await expect(fox).toHaveAttribute('data-mascot-paw', 'chin');
  await expect(animatedImg).toHaveAttribute('src', '/mascot/clips/thinking.webp');
  await shot(page, testInfo.project.name, '02-thinking.png');

  // Checking correct answer replaces inline fox cleanly with single FeedbackBar fox
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Correct!')).toBeVisible();
  await expect(fox).toHaveCount(1);
  await expect(fox).toHaveAttribute('data-mascot-state', 'correct_answer');
  await expect(animatedImg).toHaveAttribute('src', '/mascot/clips/correct_answer.webp');
  await expect
    .poll(() => animatedImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await shot(page, testInfo.project.name, '03-correct.png');

  // Advancing returns immediately cleanly to idle / next question without blocking
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(fox).toHaveCount(1);
  await expect(fox).toHaveAttribute('data-mascot-state', 'idle');

  // Answering incorrectly triggers supportive expression -> recovers smoothly into encouragement
  await page.locator('main button[aria-pressed]').nth(2).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Not quite')).toBeVisible();
  await expect(fox).toHaveCount(1);
  await expect(fox).toHaveAttribute('data-mascot-state', 'incorrect_supportive');
  await expect(animatedImg).toHaveAttribute('src', '/mascot/clips/incorrect_supportive.webp');
  await shot(page, testInfo.project.name, '04-wrong-supportive.png');
  await expect(fox).toHaveAttribute('data-mascot-state', 'encouragement', { timeout: 2000 });
  await expect(animatedImg).toHaveAttribute('src', '/mascot/clips/encouragement.webp');

  // Finish third exercise and reach lesson completion celebration
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('input[type="text"]').fill('नमस्ते');
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: 'See results' }).click();
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible();
  await expect(fox).toHaveCount(1);
  await expect(fox).toHaveAttribute('data-mascot-state', /lesson_complete|victory_dance/);
  await expect(animatedImg).toHaveAttribute('src', /\/mascot\/clips\/(lesson_complete|victory_dance)\.webp/);
  await expect
    .poll(() => animatedImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  await shot(page, testInfo.project.name, '05-lesson-complete.png');
});

test('empty practice hub shows sleepy mascot calmly and honors reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/practice');
  await expect(page.getByRole('heading', { name: 'Nothing to practice yet' })).toBeVisible();
  const sleepyFox = page.locator('[data-fox-mascot="true"][data-mascot-state="sleepy"]');
  await expect(sleepyFox).toHaveCount(1);
  const animatedClip = sleepyFox.locator('img').first();
  const staticStill = sleepyFox.locator('img').nth(1);
  await expect(animatedClip).toBeHidden();
  await expect(staticStill).toBeVisible();
  await expect(staticStill).toHaveAttribute('src', '/mascot/stills/sleepy.png');
  await expect
    .poll(() => staticStill.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
});

test('personalizes modules by experience, shows module topics/answers guide, Flow header logo, and Telugu prompts', async ({
  page,
}, testInfo) => {
  await page.goto('/learn');
  const brandLogo = page.locator('a[aria-label="Speeko home"] img');
  await expect(brandLogo).toHaveAttribute('src', '/brand/speeko-flow-logo.png');
  await expect
    .poll(() => brandLogo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);

  await page.goto('/learn/te-starter');
  // Beginner shows Module 1 (Greetings) first; switching to Conversant surfaces Module 11 first.
  await expect(page.locator('h2').first()).toHaveText('Greetings');
  await page.getByRole('button', { name: 'Conversant' }).click();
  await expect(page.locator('h2').first()).toHaveText('Conversations & Feelings');
  await shot(page, testInfo.project.name, '06-personalized-path.png');

  // Opening a module brief shows topics note and upcoming answers guide, then Continue starts the lesson.
  await page.getByRole('button', { name: /Topics & Guide/i }).first().click();
  await expect(page.getByText('Topics note')).toBeVisible();
  await expect(page.getByText('Upcoming answers guide')).toBeVisible();
  await shot(page, testInfo.project.name, '07-module-brief.png');
  await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/lesson\/te-starter\/te-starter-u11-l1\?briefed=1$/);
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();

  // Desktop Fox scales noticeably larger on desktop viewports while staying clean on mobile.
  const foxBox = await page.locator('[data-fox-mascot="true"]').first().boundingBox();
  if (testInfo.project.name === 'desktop-1280x800') {
    expect(foxBox?.width ?? 0).toBeGreaterThanOrEqual(96);
  } else {
    expect(foxBox?.width ?? 0).toBeGreaterThanOrEqual(56);
  }

  // Module 11 reaches real listening comprehension with spoken audio.
  await page.getByRole('button', { name: 'మీరు ఎలా ఉన్నారు?', exact: true }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'నేను బాగున్నాను', exact: true }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('What do you hear?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play the phrase' })).toBeVisible();

  // Telugu typing exercise explicitly states `(in Telugu)`.
  await page.goto('/lesson/te-starter/te-starter-u1-l1?briefed=1');
  await expect(page.getByRole('button', { name: 'నమస్కారం', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'నమస్కారం', exact: true }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'ధన్యవాదాలు', exact: true }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Type "hello" (in Telugu)' })).toBeVisible();
});
