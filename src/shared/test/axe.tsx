import type { ReactElement } from 'react';
import type { AxeResults, RunOptions } from 'axe-core';
import { expect } from 'vitest';
import { axe } from 'vitest-axe';

import { renderWithProviders } from './render';

/**
 * The rule set the audit runs. WCAG 2.2 AA is the target, so every tag up to
 * and including `wcag22aa` is in; `best-practice` catches the structural
 * defects WCAG words loosely — a list item outside a list, a missing landmark,
 * a heading level skipped — which are the ones that actually bite here.
 *
 * `color-contrast` is disabled on purpose and is not a silenced failure: jsdom
 * computes no layout and paints no pixels, so axe can only ever return
 * "incomplete" for it. Contrast is checked against the tokens instead, and the
 * numbers are recorded in `docs/Accessibility.md`.
 */
const AXE_OPTIONS: RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
  },
  rules: { 'color-contrast': { enabled: false } },
};

function report(results: AxeResults): string {
  return results.violations
    .map(violation => {
      const targets = violation.nodes
        .map(node => `      ${node.target.join(' ')}`)
        .join('\n');

      return `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}\n${targets}`;
    })
    .join('\n');
}

/**
 * Fails with the rule id, its impact and the offending selectors rather than a
 * bare count, because "1 violation" tells the next person nothing.
 */
export async function expectNoAxeViolations(
  container: Element,
  options: RunOptions = {},
): Promise<void> {
  const results = await axe(container, { ...AXE_OPTIONS, ...options });

  expect(report(results), 'axe found accessibility violations').toBe('');
}

/**
 * Renders a screen with the app's providers and audits it once it has settled.
 *
 * Every screen in this app opens on a skeleton and fills in from React Query,
 * so auditing the first paint would audit the loading state. `settle` is the
 * assertion that the real content has arrived; pass one that waits for
 * something only the loaded screen renders.
 */
export async function renderAndAudit(
  ui: ReactElement,
  settle?: () => Promise<unknown>,
): Promise<void> {
  const { container } = renderWithProviders(ui);

  if (settle) await settle();

  await expectNoAxeViolations(container);
}
