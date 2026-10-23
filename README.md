# Northwind Stays

A small, **fictional** hotel booking website used as a controlled target for automated UAT (user acceptance testing) with a browser-driving AI agent. There are no real bookings, payments or personal data. Bookings are "Pay at property", and everything is stored in the browser's localStorage.

- Landing page: `docs/index.html`
- Build 1.0.0: `docs/v1/` (baseline)
- Build 1.1.0: `docs/v2/` (adds Free cancellation; see `RELEASE_NOTES_1.1.0.md`)

When published with GitHub Pages (main branch, `/docs` folder) the builds are at `https://USERNAME.github.io/northwind-stays/v1/` and `.../v2/`.

## Test accounts

| Email | Password | Behaviour |
|---|---|---|
| tester@northwind.test | Test@1234 | Normal user |
| locked@northwind.test | Test@1234 | Locked |

The one-time code is always `123456` (shown on the page as "UAT test code: 123456").

**Test shortcut:** add `?as=tester` to the URL of any signed-in page (search, results, details, book, confirmation, bookings) to sign in as tester@northwind.test immediately, skipping log in and the one-time code. The parameter is removed from the address bar once it has been used.

## Repository layout

```
src/                 single source for both builds
  pages/*.html       one file per page
  partials/*.html    banner, headers, footer, logo, <head>
  app.js styles.css data.js
  landing.html       becomes docs/index.html
build.js             node build.js -> docs/v1 (1.0.0), docs/v2 (1.1.0), docs/index.html
make_sheets.py       generates the UAT test sheets from data.js
sheets/              generated .xlsx test sheets
verify/              private answer-key check (verify.js, check_sheets.py, test_rows.json)
VERIFY_REPORT.md     latest verification results
tests/agent/         Playwright tests written by the Copilot agent (see its README.md)
tests/sample/        reference tests showing correct agent output
reporters/           results reporter: writes results/results.csv and results/results.md
playwright.config.js Playwright Test settings for tests/
.github/workflows/   uat-tests.yml runs the tests in GitHub Actions
RUNNER_REPORT.md     check of the test runner and workflow
RELEASE_NOTES_1.1.0.md
ANSWER_KEY.md        what differs in 1.1.0 and which rows should fail (test team only, not deployed)
```

## Commands

```bash
node build.js
```

```bash
python make_sheets.py --base-url https://USERNAME.github.io/northwind-stays
```

```bash
node verify/verify.js --live https://USERNAME.github.io/northwind-stays
```

- `build.js` needs Node 18+ and has no dependencies. Never edit `docs/` by hand; edit `src/` and rebuild.
- `make_sheets.py` needs Python 3 and `openpyxl`. Every expected value is computed from `src/data.js`. It also writes `verify/test_rows.json`, the same rows as structured steps.
- `verify/verify.js` needs Playwright for Node (local or global install). It serves `docs/` locally, runs every row in Chromium and Microsoft Edge (if installed), audits every page, scans the deployed files and the sheets, and writes `VERIFY_REPORT.md`. `--live` also runs every row against the published site. `--no-edge` skips Edge.

## Running agent-written tests

The Copilot agent turns sheet rows into `@playwright/test` code, one test per row, titled `<StepID> <Feature>`. Put that code in `tests/agent/` as a `.spec.js` file and push. The **UAT tests** workflow runs it in GitHub Actions and shows a results table on the run's Summary page. Full steps and the rules for the tests are in [tests/agent/README.md](tests/agent/README.md).

On a Windows PC without GitHub, copy the agent's code and double-click `run-agent-tests.bat`. It runs the tests and copies the results table to the clipboard for the agent to read.

```bash
npm ci
```

```bash
npx playwright install chromium
```

```bash
npm run test:sample
```

```bash
npm run test:agent
```

- Each run writes `results/results.csv` and `results/results.md` with the columns `StepID, Feature, Status, Message, DurationSeconds, RunDate, Build`, plus `playwright-report/` (HTML report) and `test-results/` (videos, and traces and screenshots for failures). None of these are committed.
- Settings: Chromium only, 1280x800, one worker, one retry, 30 seconds per test. `BASE_URL` sets Playwright's `baseURL` (default `https://anishonly121.github.io/northwind-stays`); the tests themselves open the full URL from the sheet row.
- `tests/sample/` holds the six smoke rows for each build, which pass, and three rows that fail on Build 1.1.0, kept as examples of failure output. So `npm run test:sample` always ends with 3 failures.
- `verify/` is separate and unchanged. It is the private check against the answer key and does not use `tests/`.

## Site rules

- Static HTML, CSS and vanilla JavaScript only. No frameworks, backend or external requests (no CDNs, fonts, analytics or remote images).
- Every page shows the fictional-site banner at the top and the build label ("Build 1.0.0" or "Build 1.1.0") in the footer.
- Built for browser agents: visible `<label for>` on every input, plain text dates (DD/MM/YYYY), on-page messages (no `alert()`), no animations, modals, carousels, cookie banners, hover-only menus or date pickers. Key elements have stable `id` and `data-testid` attributes.
- Deterministic: no randomness. Booking references come from a counter (NW-100001, NW-100002, ...) in localStorage, kept separately for each build.
