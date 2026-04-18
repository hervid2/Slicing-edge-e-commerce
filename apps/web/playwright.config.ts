import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for Slicing Edge web app.
 *
 * Tests are written against a locally running dev server (Next.js on port 3000)
 * and the API on port 3001. Make sure both are running before executing E2E tests:
 *   - `npm run dev` in apps/web
 *   - `npm run dev` in apps/api
 *
 * Run: `npx playwright test` from apps/web
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
