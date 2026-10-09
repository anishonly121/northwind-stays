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
verify/              Playwright verification (verify.js, check_sheets.py, test_rows.json)
VERIFY_REPORT.md     latest verification results
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

## Site rules

- Static HTML, CSS and vanilla JavaScript only. No frameworks, backend or external requests (no CDNs, fonts, analytics or remote images).
- Every page shows the fictional-site banner at the top and the build label ("Build 1.0.0" or "Build 1.1.0") in the footer.
- Built for browser agents: visible `<label for>` on every input, plain text dates (DD/MM/YYYY), on-page messages (no `alert()`), no animations, modals, carousels, cookie banners, hover-only menus or date pickers. Key elements have stable `id` and `data-testid` attributes.
- Deterministic: no randomness. Booking references come from a counter (NW-100001, NW-100002, ...) in localStorage, kept separately for each build.
