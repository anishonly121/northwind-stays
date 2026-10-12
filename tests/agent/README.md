# Agent-written tests

Tests written by the Copilot agent go in this folder. Every push that changes this folder runs them in GitHub Actions for free and produces a results table the agent can read.

## How to run the agent's tests

1. Ask the agent to turn the test sheet rows into Playwright tests.
2. Put the code in a **new file in this folder whose name ends in `.spec.js`**, for example `build-1.1.0.spec.js`.
   - On the GitHub website: open `tests/agent`, click **Add file > Create new file**, type the file name, paste the code, click **Commit changes** and commit directly to `main`.
   - Or locally: save the file here, then `git add tests/agent`, `git commit`, `git push`.
3. Delete `example.spec.js` in the same commit. It is only a placeholder, and leaving it adds an extra NW01 row to the results.
4. The **UAT tests** workflow starts by itself when the push lands. You can also start it by hand: **Actions > UAT tests > Run workflow**.
5. Open the run. The results table is on the run's **Summary** page. Copy it back to the agent, or download the `uat-results` artifact for `results.csv` and `results.md`.

A newer run cancels one that is still going, so a "Cancelled" run in the list is normal if you push twice or click Run workflow straight after a push.

## Rules for the agent's tests

- One test per sheet row, titled `<StepID> <Feature>`, for example `NW13 Filter: max price`. The StepID becomes the StepID column in the results.
- Start each test with `page.goto(...)` using the full URL from the row. The Build column is read from that URL: `/v1/` is 1.0.0, `/v2/` is 1.1.0.
- Find elements only with `page.getByLabel`, `page.getByRole` and `page.getByText`.
- Every test is self-contained. Each one gets a fresh browser, so the first booking in a test is always `NW-100001`.
- Do not use `test.only` or `test.skip`. `test.only` stops the run in GitHub Actions, and a skipped test is reported as Fail because nothing was checked.
- Both `const { test, expect } = require('@playwright/test');` and `import { test, expect } from '@playwright/test';` work.
- If a file has a syntax error, no test runs at all. The results then show a single "Run error" row naming the file.

See `tests/sample/` for complete examples of correct output.

## What is what on the site

Some things that look like buttons are links. `getByRole('button', ...)` will not find a link.

| On the page | How to find it |
|---|---|
| Log in, Verify, Search, Apply filters, Clear filters, Confirm booking, Cancel booking, Log out | `page.getByRole('button', { name: 'Apply filters', exact: true })` |
| View details, Book now, Go to My bookings, Search and My bookings in the header, Reset demo data | `page.getByRole('link', { name: 'Book now', exact: true })` |
| Text fields (Email, Password, One-time code, Check-in (DD/MM/YYYY), Full name, Mobile number (+65), Min price per night (S$) ...) | `page.getByLabel('Email', { exact: true }).fill('...')` |
| Dropdowns (City, Guests, Rooms, Sort by) | `page.getByLabel('City', { exact: true }).selectOption('Singapore')` |
| Checkboxes (5 stars, Hotel, Pool, Free cancellation ...) | `page.getByLabel('Pool', { exact: true }).check()` |
| One property card | `page.getByRole('article').filter({ hasText: 'Lantern Quay Hotel' })` |
| A button or link inside one card | `...filter({ hasText: 'Lantern Quay Hotel' }).getByRole('link', { name: 'View details' })` |
| Page heading | `page.getByRole('heading', { level: 1 })` |
| Property name on a card | `page.getByRole('heading', { name: 'Lantern Quay Hotel', exact: true })` |
| Number of property cards | `expect(page.getByRole('link', { name: 'View details' })).toHaveCount(4)` |

Use `{ exact: true }` on labels, names and text. Without it the match is "contains", so `getByText('Search')` also matches "Search results" and the test stops because it found more than one element.

## Checks that give useful failure messages

The Message column is built from the failed check. Write the check so it reads the real text from the page:

```js
// Good: a failure says  Expected: "Total: S$1,110". Received: "Total: S$555".
await expect(page.getByText(/^Total: /)).toHaveText('Total: S$1,110');
await expect(page.getByText(/propert(y|ies) found|No properties match/)).toHaveText('3 properties found');
await expect(page.getByRole('heading', { level: 1 })).toHaveText('Booking confirmed');
await expect(page.getByLabel('Pool', { exact: true })).not.toBeChecked();

// Works, but a failure can only say the text was not found:
await expect(page.getByText('Total: S$1,110', { exact: true })).toBeVisible();
```

After a click that opens a new page, check the page heading first. It makes the test wait for the new page before checking anything else.

## Results columns

`StepID, Feature, Status, Message, DurationSeconds, RunDate, Build`

- **Status** is Pass or Fail, from the final attempt. Each test is retried once. A test that only passed on the retry has `(retried)` in Message.
- **Message** is empty on a pass. On a fail it is a short summary of the first error.
- **DurationSeconds** is the time of the final attempt.
- **RunDate** is the Singapore date, DD/MM/YYYY.
