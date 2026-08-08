import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3001';
const isCI = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  // A `.only` left in a branch would silently skip the rest of the suite.
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: isCI
    ? [['github'], ['html', { open: 'never' }], ['blob']]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: APP_URL,
    // Traces are the difference between "flaky, rerunning" and an actual diagnosis.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  // Reuses an already-running dev server locally; boots a production build in CI,
  // because that is the artifact that actually ships.
  webServer: {
    command: isCI ? 'pnpm start' : 'pnpm dev',
    url: APP_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
