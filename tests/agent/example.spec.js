// Placeholder so this folder always has one test. Delete this file once the agent's
// own test file is in this folder, otherwise the results show an extra NW01 row.
const { test, expect } = require('@playwright/test');

test('NW01 Login', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v1/login.html');
  await page.getByLabel('Email', { exact: true }).fill('tester@northwind.test');
  await page.getByLabel('Password', { exact: true }).fill('Test@1234');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();

  // On the one-time code page
  await page.getByLabel('One-time code', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a stay');
  await expect(page.getByText('Signed in as tester@northwind.test', { exact: true })).toBeVisible();
});
