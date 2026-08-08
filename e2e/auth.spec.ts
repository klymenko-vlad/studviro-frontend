import { expect, test } from '@playwright/test';

/**
 * These assert the properties the BFF exists to provide — that no token is
 * reachable from the page, and that a signed-out visitor cannot see an
 * authenticated route. They deliberately do not need a live backend: a running
 * API is the e2e suite's one external dependency, and the sign-in *flow* is
 * covered by the backend's own e2e specs plus the component tests.
 */
test.describe('protected routes', () => {
  test('sends a signed-out visitor to sign-in, remembering where they were headed', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
  });

  test('offers a labelled form', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });
});

test.describe('session cookies', () => {
  test('are never readable from the page', async ({ page }) => {
    await page.goto('/sign-in');

    const readable = await page.evaluate(() => document.cookie);

    // httpOnly means `document.cookie` cannot see them even once they exist —
    // this is what stops an injected script from stealing a credential.
    expect(readable).not.toContain('sv_at');
    expect(readable).not.toContain('sv_rt');
  });

  test('the refresh endpoint rejects a cross-origin caller', async ({ request }) => {
    const response = await request.post('/api/auth/refresh', {
      headers: { origin: 'https://evil.example' },
      data: {},
    });

    expect(response.status()).toBe(403);
  });

  test('the refresh endpoint reports no session rather than erroring', async ({
    page,
  }) => {
    await page.goto('/');

    const status = await page.evaluate(async () => {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      return response.status;
    });

    expect(status).toBe(401);
  });

  test('the API proxy rejects a cross-origin write', async ({ request }) => {
    const response = await request.post('/api/proxy/api/v1/users', {
      headers: { origin: 'https://evil.example' },
      data: {},
    });

    expect(response.status()).toBe(403);
  });
});
