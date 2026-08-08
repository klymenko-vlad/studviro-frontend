import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './fixtures/axe';

test.describe('home page', () => {
  test('renders the landing content in the default locale', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Studviro');
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('serves the language named by the browser, with no URL of its own', async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: 'uk-UA' });
    const page = await context.newPage();

    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Почати' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    // The whole point of ADR 0007: the language changed, the address did not.
    await expect(page).toHaveURL(/\/$/);

    await context.close();
  });

  test('has no /uk route left to serve', async ({ page }) => {
    const response = await page.goto('/uk');

    expect(response?.status()).toBe(404);
  });

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto('/');

    await expectNoA11yViolations(page);
  });

  test('sets the baseline security headers', async ({ page }) => {
    const response = await page.goto('/');

    const headers = response?.headers() ?? {};
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    // Advertising the framework version only helps someone matching a CVE.
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('shows the not-found page for an unknown route', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });
});

test.describe('theme', () => {
  test('applies dark mode and remembers the choice across a reload', async ({ page }) => {
    await page.goto('/');

    const group = page.getByRole('radiogroup', { name: 'Theme' });
    await group.getByRole('radio', { name: 'Dark' }).click();

    await expect(page.locator('html')).toHaveClass(/dark/);

    // The blocking script in the layout must restore this before first paint.
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(group.getByRole('radio', { name: 'Dark' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
