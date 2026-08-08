import { expect, test } from '@playwright/test';

test.describe('language switching', () => {
  test('changes language without changing the URL, and survives a reload', async ({
    page,
  }) => {
    await page.goto('/');

    const group = page.getByRole('radiogroup', { name: 'Language' });
    await group.getByRole('radio', { name: 'Українська' }).click();

    await expect(page.getByRole('button', { name: 'Почати' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page).toHaveURL(/\/$/);

    // The cookie, not the address, is what carries the choice forward.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page).toHaveURL(/\/$/);
  });

  test('pins a locale cookie on the first visit', async ({ page, context }) => {
    await page.goto('/');

    const cookie = (await context.cookies()).find(({ name }) => name === 'NEXT_LOCALE');

    expect(cookie?.value).toBe('en');
    // Readable by JS deliberately: it carries no authority, and a client-side
    // widget knowing the display language is useful.
    expect(cookie?.httpOnly).toBe(false);
  });

  test('is not storable by a shared cache, since one URL serves every language', async ({
    page,
  }) => {
    const response = await page.goto('/');

    /**
     * `Vary: Cookie` would be the obvious guard, but Next writes its own `Vary`
     * for App Router responses and discards anything middleware or
     * `next.config.ts` sets. What actually prevents a CDN handing one visitor's
     * language to the next is that these pages are dynamic, so Next marks them
     * must-revalidate. A CDN configured to override this would reintroduce the
     * bug.
     */
    expect(response?.headers()['cache-control']).toContain('must-revalidate');
  });
});
