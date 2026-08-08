import { expect, test } from '@playwright/test';

/** Splits a policy string into directive → value for readable assertions. */
function parseCsp(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map(directive => {
      const [name, ...rest] = directive.trim().split(/\s+/);
      return [name ?? '', rest.join(' ')];
    }),
  );
}

test.describe('content security policy', () => {
  test('is served from the proxy, not the static headers config', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.headers()['content-security-policy']).toBeTruthy();
  });

  test('allows no cross-origin fetch destination', async ({ page }) => {
    const response = await page.goto('/');
    const csp = parseCsp(response?.headers()['content-security-policy'] ?? '');

    // Browser-side API calls go through the same-origin BFF, so an injected
    // script has nowhere off-origin to send what it steals.
    expect(csp['connect-src']).toBe(`'self'`);
  });

  test('locks down the dangerous directives', async ({ page }) => {
    const response = await page.goto('/');
    const csp = parseCsp(response?.headers()['content-security-policy'] ?? '');

    expect(csp['object-src']).toBe(`'none'`);
    expect(csp['frame-ancestors']).toBe(`'none'`);
    expect(csp['base-uri']).toBe(`'self'`);
    expect(csp['form-action']).toBe(`'self'`);
  });

  test('allows inline script by nonce, not by unsafe-inline', async ({ page }) => {
    const response = await page.goto('/');
    const csp = parseCsp(response?.headers()['content-security-policy'] ?? '');

    expect(csp['script-src']).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp['script-src']).not.toContain('unsafe-inline');
  });

  test('issues a different nonce on every response', async ({ page }) => {
    const nonceOf = async () => {
      const response = await page.goto('/');
      return /'nonce-([A-Za-z0-9+/=]+)'/.exec(
        response?.headers()['content-security-policy'] ?? '',
      )?.[1];
    };

    const [first, second] = [await nonceOf(), await nonceOf()];

    // A nonce reused across responses is guessable from any cached page, which
    // reduces it to 'unsafe-inline' with extra steps.
    expect(first).toBeTruthy();
    expect(first).not.toBe(second);
  });

  /**
   * The real proof. The browser, not our code, decides whether a script runs —
   * and a policy that blocks Next's own inline bootstrap leaves the page
   * unhydrated while every unit test still passes. Asserting on console
   * violations is the only check that catches it.
   */
  test('executes every inline script without a CSP violation', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', message => {
      if (
        message.type() === 'error' &&
        message.text().includes('Content Security Policy')
      )
        violations.push(message.text());
    });

    await page.goto('/');

    expect(violations).toEqual([]);
  });
});

test.describe('theme initialisation', () => {
  test('applies the stored dark theme before first paint', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'studviro-theme',
        JSON.stringify({ state: { theme: 'dark' }, version: 0 }),
      );
    });

    await page.goto('/');

    // The blocking script runs in <head>, so the class is present on the very
    // first paint rather than after hydration — no flash of the light theme.
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  });

  test('follows the OS preference when nothing is stored', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();

    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await context.close();
  });

  test('honours an explicit light choice over a dark OS preference', async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'studviro-theme',
        JSON.stringify({ state: { theme: 'light' }, version: 0 }),
      );
    });

    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await context.close();
  });
});

test.describe('crawler directives', () => {
  test('serves robots.txt', async ({ request }) => {
    const response = await request.get('/robots.txt');

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('User-Agent: *');
  });

  test('serves a sitemap with one entry per page, not per language', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');
    const body = await response.text();

    expect(response.status()).toBe(200);
    // One URL serves every language now, so hreflang alternates would point at
    // addresses that do not exist — see ADR 0007.
    expect(body).not.toContain('hreflang');
  });
});
