import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * M2 — headless web sign-off.
 *
 * Captures, in a real browser at the two Playwright projects (desktop-1280x800,
 * mobile-390x844), the parts of the M2 mobile/web functional checklist
 * (docs/qa/android-device-qa.md, "Onboarding and accounts" through "Lesson
 * flow") that the web app can stand in for: creating a brand-new account via
 * the real sign-up UI, reaching a signed-in account state, signing out and
 * losing the session, signing in with an account provisioned beforehand
 * through the API (right and wrong password), and completing + replaying one
 * short Bengali lesson through the real player (bn-starter-u1-l2 = 2x
 * chooseMeaning + 1x matchPairs, no typing, no audio).
 *
 * What this suite deliberately does NOT do:
 *   - It does not touch adb or any Android/iOS artifact. Device-only M2 items
 *     (release APK, relaunch/session restore, adb logcat, haptics, hearts on
 *     device, …) are verified by a human on the Vivo V2336 — not here.
 *   - It never reads, prints, logs, or commits a QA credential. The sign-in
 *     account is created per run through the real sign-up endpoint with a
 *     random password held only in memory.
 *   - It never builds, starts, or stops the web/API servers; Playwright's
 *     webServer config (playwright.config.ts) owns those.
 */

const API_URL = 'http://localhost:3001';
const ORIGIN = 'http://localhost:3000';

/** bn-starter-u1-l2 ("Yes & No", A1): chooseMeaning ×2 then matchPairs. */
const QA_LESSON = {
  courseId: 'bn-starter',
  lessonId: 'bn-starter-u1-l2',
} as const;
const QA_LESSON_PATH = `/lesson/${QA_LESSON.courseId}/${QA_LESSON.lessonId}`;

/** Throwaway accounts created by this spec; the timestamp keeps them unique. */
function throwawayEmail(): string {
  return `m2-qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@speeko.test`;
}
const THROWAWAY_PASSWORD = 'speeko-m2-throwaway-password';

/**
 * Provision a throwaway account through the real sign-up endpoint so the
 * sign-in test exercises a pre-existing account rather than one created in
 * the page under test. The password is random per run and never logged.
 * The shared API is already running (Playwright webServer).
 */
async function provisionAccount(
  request: APIRequestContext,
): Promise<{ email: string; password: string }> {
  const email = `m2-qa-signin-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@speeko.test`;
  const password = `speeko-m2-signin-${randomUUID()}`;
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    headers: { origin: ORIGIN },
    data: { name: 'M2 QA', email, password },
  });
  expect(response.status(), await response.text()).toBe(200);
  return { email, password };
}

/** Create a brand-new throwaway account through the real sign-up web UI. */
async function signUpViaUi(page: Page, email: string, name: string): Promise<void> {
  await page.goto('/sign-up');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(THROWAWAY_PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  // AuthForm pushes /learn on success.
  await page.waitForURL(/\/learn$/);
}

/**
 * Play bn-starter-u1-l2 through the real lesson player. The exercise order
 * and the correct options are the content's own (content/bn/bn-starter.json):
 *   e1 chooseMeaning "Yes" → হ্যাঁ   (options may show হ্যাঁ first)
 *   e2 chooseMeaning "No"  → না
 *   e3 matchPairs          → Yes→হ্যাঁ, No→না (right column order is shuffled
 *      deterministically, so match by text, never by position)
 */
async function completeBnStarterU1L2(page: Page): Promise<void> {
  await page.goto(QA_LESSON_PATH);
  await expect(page.getByRole('button', { name: 'Check' })).toBeVisible();

  // e1 — chooseMeaning, prompt "Yes".
  await expect(page.getByRole('heading', { name: 'Yes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'হ্যাঁ', exact: true }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Correct!')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  // e2 — chooseMeaning, prompt "No".
  await expect(page.getByRole('heading', { name: 'No', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'না', exact: true }).click();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Correct!')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  // e3 — matchPairs. Tap each left word, then its right-side match.
  await expect(page.getByRole('heading', { name: 'Match the pairs' })).toBeVisible();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await page.getByRole('button', { name: 'হ্যাঁ', exact: true }).click();
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await page.getByRole('button', { name: 'না', exact: true }).click();
  await expect(page.getByText('All pairs matched. Nice!')).toBeVisible();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Correct!')).toBeVisible();
  await page.getByRole('button', { name: 'See results' }).click();
}

test.describe('M2 headless sign-off — web app', () => {
  test.beforeEach(async ({ page }) => {
    // Render the summary with final totals instead of a mid-animation frame.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test.setTimeout(120_000);
  test('sign-up via the web UI reaches a signed-in account page; sign-out drops the session', async ({
    page,
  }) => {
    const email = throwawayEmail();
    await signUpViaUi(page, email, 'M2 QA');

    // Signed-in state: /account shows the learner's identity and the
    // signed-in affordances (AccountPanel renders one of three account chips
    // depending on the /api/habits sync result — accept any of them, but the
    // identity and the Sign out button are unconditional).
    await page.goto('/account');
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(
      page.getByText(/Verified account|Cloud sync on|Account sync unreachable/),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'You are learning as a guest' }),
    ).toHaveCount(0);

    // Sign out through the real button, then the same session cookie must no
    // longer authenticate against the API.
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL((url) => url.pathname === '/');

    const progress = await page.request.get(`${API_URL}/api/progress`, {
      headers: { origin: ORIGIN },
    });
    expect(progress.status()).toBe(401);

    // And the account page falls back to the guest state.
    await page.goto('/account');
    await expect(
      page.getByRole('heading', { name: 'You are learning as a guest' }),
    ).toBeVisible();
  });

  test.setTimeout(120_000);
  test('provisioned account sign-in works; a wrong password shows an error and stays signed out', async ({
    page,
    request,
  }) => {
    const qa = await provisionAccount(request);

    // Wrong password: better-auth answers INVALID_EMAIL_OR_PASSWORD
    // ("Invalid email or password"); AuthForm renders it in role="alert".
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(qa.email);
    await page.getByLabel('Password').fill('definitely-not-the-qa-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    const alert = page.locator('form [role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/invalid/i);
    await expect(page).toHaveURL(/\/sign-in/);

    // NOT signed in: the account page still renders the guest state.
    await page.goto('/account');
    await expect(
      page.getByRole('heading', { name: 'You are learning as a guest' }),
    ).toBeVisible();

    // Correct password: signs in and lands on /learn.
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(qa.email);
    await page.getByLabel('Password').fill(qa.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(/\/learn$/);

    await page.goto('/account');
    await expect(page.getByText(qa.email)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'You are learning as a guest' }),
    ).toHaveCount(0);
  });

  test('completing bn-starter-u1-l2 awards XP; a replay is practice only', async ({ page }) => {
    // Use a fresh throwaway account (not the provisioned sign-in account) so
    // the first completion — and therefore an XP reward greater than zero — is
    // guaranteed no matter what lessons have already been completed.
    const email = throwawayEmail();
    await signUpViaUi(page, email, 'M2 QA');

    await completeBnStarterU1L2(page);

    // First completion: the summary XP card shows a positive award.
    await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible();
    const xpCard = page.getByText(/^\+[1-9]\d*$/);
    await expect(xpCard.first()).toBeVisible();
    const xpText = (await xpCard.first().textContent()) ?? '';
    expect(Number(xpText.replace('+', ''))).toBeGreaterThan(0);
    await expect(page.getByRole('status')).toContainText('Reward saved to your account.');

    // Replay the exact same lesson: practice-only summary, no new XP.
    await completeBnStarterU1L2(page);
    await expect(page.getByRole('heading', { name: 'Practice complete!' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      'Lesson saved — practice only, no new completion XP.',
    );
    await expect(page.getByText('No new XP', { exact: true })).toBeVisible();
  });
});
