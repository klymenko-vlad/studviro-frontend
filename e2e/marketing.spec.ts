import { expect, test, type Page } from '@playwright/test';

import { expectNoA11yViolations } from './fixtures/axe';

const PAGES = [
  { path: '/', heading: 'One academic platform over the systems you already run' },
  { path: '/for-students', heading: 'Stop assembling your own timetable' },
  { path: '/for-teachers', heading: 'Your teaching, without the second login' },
  {
    path: '/for-institutions',
    heading: 'One surface over the systems you already run',
  },
  { path: '/contact', heading: 'Request a demo' },
] as const;

/**
 * The footer carries the same links as the header and is present at every
 * width, so a navigation test written against it runs on the mobile project
 * too — where the header's marketing nav is deliberately hidden.
 */
function footerNav(page: Page) {
  return page.getByRole('contentinfo').getByRole('navigation', { name: 'Product' });
}

/**
 * Proves the form has hydrated before anything is typed into it.
 *
 * The markup is server-rendered, and React discards whatever was typed into it
 * before hydration finished — which under a loaded machine is long enough to
 * lose a field. Client-side validation cannot run until React is attached, so
 * an error message appearing is the signal, and nothing weaker is one.
 */
async function waitForHydratedForm(page: Page) {
  await page.getByLabel('Work email').fill('not-an-email');
  await page.getByRole('button', { name: 'Request a demo' }).click();

  await expect(page.getByLabel('Work email')).toHaveAttribute('aria-invalid', 'true');
}

async function fillDemoForm(page: Page, email: string) {
  await page.getByLabel('Institution').fill('Comenius University');
  await page.getByLabel('Your name').fill('Ada Lovelace');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Your role').fill('Vice-dean for study affairs');
}

test.describe('marketing pages', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} leads with one heading that says what it is`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });
  }

  test('walks a visitor from the home page to an audience page and on to the form', async ({
    page,
  }) => {
    await page.goto('/');

    await footerNav(page).getByRole('link', { name: 'For students' }).click();
    await expect(page).toHaveURL(/\/for-students$/);

    await footerNav(page).getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByLabel('Work email')).toBeVisible();
  });

  test('accepts a demo request and says so', async ({ page }) => {
    await page.goto('/contact');
    await waitForHydratedForm(page);

    // A distinct address per run, so the backend's per-email deduplication
    // cannot be what makes this pass on the second attempt.
    await fillDemoForm(page, `dean-${Date.now()}@university.edu`);
    await page.getByRole('button', { name: 'Request a demo' }).click();

    await expect(page.getByText('Thank you — your request is in')).toBeVisible();
    await expect(page.getByLabel('Institution')).toHaveValue('');
  });

  test('refuses an invalid request at the field rather than on submit', async ({
    page,
  }) => {
    await page.goto('/contact');

    await waitForHydratedForm(page);

    await expect(page.getByText('Thank you — your request is in')).toBeHidden();
  });

  test('lists every marketing page in the sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    const body = await response.text();

    for (const { path } of PAGES) {
      expect(body).toContain(path === '/' ? '</loc>' : `${path}</loc>`);
    }
  });

  test('has no serious accessibility violations on the contact page', async ({
    page,
  }) => {
    await page.goto('/contact');

    await expectNoA11yViolations(page);
  });

  test('has no serious accessibility violations on an audience page', async ({
    page,
  }) => {
    await page.goto('/for-institutions');

    await expectNoA11yViolations(page);
  });
});
