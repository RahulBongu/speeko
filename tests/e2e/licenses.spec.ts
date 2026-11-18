import { expect, test } from '@playwright/test';

/**
 * Apache-2.0 section 4 requires recipients of a distributed artifact to
 * receive a copy of the License. The web build copies the texts into
 * public/licenses (scripts/sync-licenses.mjs); these checks fail if the page or
 * the files stop shipping.
 */
test.describe('license artifact', () => {
  test('serves the licenses page and the bundled license texts', async ({ page, request }) => {
    const response = await page.goto('/licenses');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Licenses and attributions' })).toBeVisible();

    const license = await request.get('/licenses/LICENSE');
    expect(license.status()).toBe(200);
    const licenseText = await license.text();
    expect(licenseText).toContain('Apache License');
    expect(licenseText).toContain('Version 2.0');

    const content = await request.get('/licenses/LICENSE-CONTENT');
    expect(content.status()).toBe(200);
    expect(await content.text()).toContain('All Rights Reserved');

    const notice = await request.get('/licenses/NOTICE');
    expect(notice.status()).toBe(200);
    expect(await notice.text()).toContain('Speeko');

    const ofl = await request.get('/licenses/OFL.txt');
    expect(ofl.status()).toBe(200);
    expect(await ofl.text()).toContain('SIL OPEN FONT LICENSE Version 1.1');
  });
});