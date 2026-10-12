// Sample UAT tests: three rows of sheets/Northwind_Tests_Build_1.1.0.xlsx that do not pass on Build 1.1.0.
//
// Each test states what the sheet row expects. On /v2/ the page shows something else,
// so all three fail. They are kept as examples of what a failed row looks like in
// results/results.md: the Message column shows the expected value next to the
// received one, because values are checked with toHaveText and toBeChecked.
const { test, expect } = require('@playwright/test');

test('NW13 Filter: max price', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v2/results.html?as=tester&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=1');
  await page.getByLabel('Max price per night (S$)', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();

  // After clicking Apply filters
  await expect(page.getByText(/propert(y|ies) found|No properties match/)).toHaveText('3 properties found');
  await expect(page.getByRole('link', { name: 'View details' })).toHaveCount(3);
  for (const name of ['Lantern Quay Hotel', 'Kestrel Garden Inn', 'Tidewater Residences']) {
    await expect(page.getByRole('heading', { name: name, exact: true })).toBeVisible();
  }
});

test('NW20 Filter: clear filters', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v2/results.html?as=tester&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=1');
  await page.getByLabel('4 stars', { exact: true }).check();
  await page.getByLabel('Pool', { exact: true }).check();
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();

  // After clicking Apply filters
  await expect(page.getByText(/propert(y|ies) found|No properties match/)).toHaveText('1 property found');

  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();

  // After clicking Clear filters
  await expect(page.getByLabel('4 stars', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('Pool', { exact: true })).not.toBeChecked();
  await expect(page.getByText(/propert(y|ies) found|No properties match/)).toHaveText('4 properties found');
  await expect(page.getByRole('link', { name: 'View details' })).toHaveCount(4);
  for (const name of ['Northwind Marina Suites', 'Lantern Quay Hotel', 'Kestrel Garden Inn', 'Tidewater Residences']) {
    await expect(page.getByRole('heading', { name: name, exact: true })).toBeVisible();
  }
});

test('NW27 Booking', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v2/results.html?as=tester&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=2');
  await page.getByRole('article').filter({ hasText: 'Lantern Quay Hotel' }).getByRole('link', { name: 'View details' }).click();

  // On the details page
  await page.getByRole('link', { name: 'Book now', exact: true }).click();

  // Before confirming, on the booking page: check the booking summary
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Complete your booking');
  await expect(page.getByText(/^Nights: /)).toHaveText('Nights: 3');
  await expect(page.getByText(/^Rooms: /)).toHaveText('Rooms: 2');
  await expect(page.getByText(/^Total: /)).toHaveText('Total: S$1,110');

  await page.getByLabel('Full name', { exact: true }).fill('Alex Tester');
  await page.getByLabel('Email', { exact: true }).fill('alex.tester@northwind.test');
  await page.getByLabel('Mobile number (+65)', { exact: true }).fill('91234567');
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();

  // After clicking Confirm booking
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Booking confirmed');
  await expect(page.getByText(/^Total: /)).toHaveText('Total: S$1,110');
});
