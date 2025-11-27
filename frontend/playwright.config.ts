import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/modules',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* Use list reporter for CI/PRE_COMMIT (auto-exits), html for manual runs and demos */
  reporter: process.env.CI || process.env.PRE_COMMIT
    ? [['list'], ['json', { outputFile: 'test-results.json' }]]
    : process.env.HTML_REPORT === '1'
    ? 'html'
    : 'html', // Default to html for manual runs (can be opened in browser)
  /* Global timeout for each test */
  timeout: 30000,
  /* Expect timeout */
  expect: {
    timeout: 5000,
  },
  /* Auto-exit when tests complete (don't wait for user input) */
  globalSetup: undefined,
  globalTeardown: undefined,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:7001',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:7001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

