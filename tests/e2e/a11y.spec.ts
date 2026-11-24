import { expect, test } from '@playwright/test';

const AXE_PATH = require.resolve('axe-core/axe.min.js');

/**
 * Automated accessibility regression guard. axe-core is injected from the
 * workspace's existing dependency; no new package or paid service is added.
 * Only serious/critical WCAG A/AA violations fail the build — cosmetic best
 * practices remain documented rather than blocking.
 */
const routes = [
  ['home', '/'],
  ['learn', '/learn'],
  ['course', '/learn/hi-starter'],
  ['lesson', '/lesson/hi-starter/hi-starter-u1-l1'],
  ['practice', '/practice'],
  ['habits', '/habits'],
  ['shop', '/shop'],
  ['account', '/account'],
  ['sign-in', '/sign-in'],
  ['leagues', '/leagues'],
] as const;

for (const [name, route] of routes) {
  test(`a11y: ${name} has no serious WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    await page.addScriptTag({ path: AXE_PATH });
    const violations = await page.evaluate(async () => {
      const result = await (window as any).axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      });
      return result.violations
        .filter((v: any) => ['serious', 'critical'].includes(v.impact))
        .map((v: any) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        }));
    });
    expect(violations, `axe violations on ${route}: ${JSON.stringify(violations)}`).toEqual([]);
  });
}
