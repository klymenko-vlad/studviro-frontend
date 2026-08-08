import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Fails the test on any serious or critical WCAG violation on the current page.
 *
 * Scoped to serious/critical on purpose: `minor` findings are frequently
 * debatable or third-party, and a check that everyone learns to ignore protects
 * nobody. Raise the bar once the app is clean at this level.
 */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(violation =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );

  expect(
    blocking,
    blocking
      .map(v => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes[0]?.html ?? ''}`)
      .join('\n'),
  ).toEqual([]);
}
