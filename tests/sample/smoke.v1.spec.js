// Sample UAT tests: the 6 Smoke rows of sheets/Northwind_Tests_Build_1.0.0.xlsx (Build 1.0.0).
//
// These show what correct agent output looks like:
//   - one test per sheet row, titled "<StepID> <Feature>"
//   - each test starts from the full URL in the row and is self-contained
//   - elements are found only with page.getByLabel, page.getByRole and page.getByText
//   - text that carries a value (counts, totals, headings) is checked with toHaveText,
//     so a failure reports both the expected text and what the page really showed
const { test, expect } = require('@playwright/test');

test('NW01 Login and one-time code', async ({ page }) => {
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

test('NW06 Logout', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v1/search.html?as=tester');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();

  await expect(page.getByText('You have been logged out.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Log in to Northwind Stays');
  await expect(page).toHaveURL(/login\.html/);
});

test('NW10 Search', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v1/search.html?as=tester');
  await page.getByLabel('City', { exact: true }).selectOption('Singapore');
  await page.getByLabel('Check-in (DD/MM/YYYY)', { exact: true }).fill('12/03/2027');
  await page.getByLabel('Check-out (DD/MM/YYYY)', { exact: true }).fill('15/03/2027');
  await page.getByLabel('Guests', { exact: true }).selectOption('2');
  await page.getByLabel('Rooms', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Search results');
  await expect(page.getByText(/propert(y|ies) found|No properties match/)).toHaveText('4 properties found');
  await expect(page.getByRole('link', { name: 'View details' })).toHaveCount(4);
  for (const name of ['Northwind Marina Suites', 'Lantern Quay Hotel', 'Kestrel Garden Inn', 'Tidewater Residences']) {
    await expect(page.getByRole('heading', { name: name, exact: true })).toBeVisible();
  }
});

test('NW25 Property details', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v1/results.html?as=tester&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=1');
  await page.getByRole('article').filter({ hasText: 'Lantern Quay Hotel' }).getByRole('link', { name: 'View details' }).click();

  // On the details page
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lantern Quay Hotel');
  await expect(page.getByText('S$185 per night', { exact: true })).toBeVisible();
  await expect(page.getByText('4 stars', { exact: true })).toBeVisible();
  await expect(page.getByText('8.7/10', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Nights: /)).toHaveText('Nights: 3');
  await expect(page.getByRole('link', { name: 'Book now', exact: true })).toBeVisible();
});

test('NW26 Booking', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v1/details.html?as=tester&id=northwind-marina-suites&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=1');
  await page.getByRole('link', { name: 'Book now', exact: true }).click();

  // Before confirming, on the booking page: check the booking summary
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Complete your booking');
  await expect(page.getByText(/^Nights: /)).toHaveText('Nights: 3');
  await expect(page.getByText(/^Rooms: /)).toHaveText('Rooms: 1');
  await expect(page.getByText(/^Total: /)).toHaveText('Total: S$960');
  await expect(page.getByText('Payment: Pay at property', { exact: true })).toBeVisible();

  await page.getByLabel('Full name', { exact: true }).fill('Alex Tester');
  await page.getByLabel('Email', { exact: true }).fill('alex.tester@northwind.test');
  await page.getByLabel('Mobile number (+65)', { exact: true }).fill('91234567');
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();

  // After clicking Confirm booking
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Booking confirmed');
  await expect(page.getByText('Northwind Marina Suites', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Total: /)).toHaveText('Total: S$960');
  await expect(page.getByText('Payment: Pay at property', { exact: true })).toBeVisible();
});

test('NW32 My bookings', async ({ page }) => {
  await page.goto('https://anishonly121.github.io/northwind-stays/v1/book.html?as=tester&id=tidewater-residences&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=1');
  await page.getByLabel('Full name', { exact: true }).fill('Alex Tester');
  await page.getByLabel('Email', { exact: true }).fill('alex.tester@northwind.test');
  await page.getByLabel('Mobile number (+65)', { exact: true }).fill('91234567');
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();

  // On the confirmation page
  await page.getByRole('link', { name: 'Go to My bookings', exact: true }).click();

  // On the My bookings page
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('My bookings');
  await expect(page.getByText('NW-100001', { exact: true })).toBeVisible();
  await expect(page.getByText('Tidewater Residences', { exact: true })).toBeVisible();
  await expect(page.getByText('12/03/2027 to 15/03/2027', { exact: true })).toBeVisible();
  await expect(page.getByText('S$600', { exact: true })).toBeVisible();
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel booking', exact: true })).toBeVisible();
});
