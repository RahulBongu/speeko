import { expect, test } from '@playwright/test';

test('home marketing sections render and sample question checks', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Speak a little more/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Three minutes up the path/i }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /Say hello in ten scripts/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /The fox has a voice/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Good to know/i })).toBeVisible();

  const greetingLinks = page.locator('#languages a[href^="/learn/"]');
  await expect(greetingLinks).toHaveCount(10);
  await expect(page.getByRole('link', { name: /^Practice/ }).first()).toBeVisible();

  await page.getByRole('button', { name: 'नमस्ते', exact: true }).click();
  await expect(page.getByText(/all-purpose Hindi greeting/)).toBeVisible();

  expect(pageErrors, 'uncaught page errors').toEqual([]);
});
