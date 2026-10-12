// Playwright Test configuration for Northwind Stays UAT tests.
// Tests live in tests/agent (written by the Copilot agent) and tests/sample (reference examples).
const { defineConfig, devices } = require('@playwright/test');

const baseURL = (process.env.BASE_URL || 'https://anishonly121.github.io/northwind-stays').replace(/\/+$/, '');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  timeout: 30000,
  workers: 1,
  retries: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['./reporters/results-reporter.js']
  ],
  use: {
    baseURL: baseURL,
    video: 'on',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: Object.assign({}, devices['Desktop Chrome'], { viewport: { width: 1280, height: 800 } })
    }
  ]
});
