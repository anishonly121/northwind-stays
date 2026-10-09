# Northwind Stays verification report

Generated 2026-10-09 03:21 UTC by `node verify/verify.js` against a local static server serving `docs/`. Viewport 1280x800, one fresh browser context per row.

Browsers: Chromium 149.0.7827.55, Microsoft Edge 154.0.4258.62. Playwright 1.61.0.

**Overall result: PASS, every expectation holds**

## Summary

| Check | Expected | Result |
|---|---|---|
| Chromium 149.0.7827.55: Build 1.0.0 sheet on v1 | all 34 rows pass | 34/34 pass, PASS |
| Chromium 149.0.7827.55: Build 1.1.0 sheet on v2 | only NW13, NW20, NW27 fail | 31/34 pass, failed: NW13, NW20, NW27, PASS |
| Chromium 149.0.7827.55: smoke rows on v2 | all 6 pass | 6/6 pass, PASS |
| Chromium 149.0.7827.55: new feature rows on v2 | all 4 pass | 4/4 pass, PASS |
| Microsoft Edge 154.0.4258.62: Build 1.0.0 sheet on v1 | all 34 rows pass | 34/34 pass, PASS |
| Microsoft Edge 154.0.4258.62: Build 1.1.0 sheet on v2 | only NW13, NW20, NW27 fail | 31/34 pass, failed: NW13, NW20, NW27, PASS |
| Microsoft Edge 154.0.4258.62: smoke rows on v2 | all 6 pass | 6/6 pass, PASS |
| Microsoft Edge 154.0.4258.62: new feature rows on v2 | all 4 pass | 4/4 pass, PASS |
| Banner and build label on every page | 19 pages | 19/19 pass, PASS |
| Requests to external domains | none | 0, PASS |
| Revealing words, absolute URLs, alert(), randomness in deployed files | none in 26 files | 0 findings, PASS |
| Test sheet structure (3 workbooks) | all checks pass | 63/63 pass, PASS |

## Core rows (Chromium 149.0.7827.55)

| StepID | Feature | Smoke | Build 1.0.0 (v1) | Build 1.1.0 (v2) | Detail on v2 failure |
|---|---|---|---|---|---|
| NW01 | Login and one-time code | Yes | PASS | PASS |  |
| NW02 | Login | No | PASS | PASS |  |
| NW03 | Login | No | PASS | PASS |  |
| NW04 | One-time code | No | PASS | PASS |  |
| NW05 | Access control | No | PASS | PASS |  |
| NW06 | Logout | Yes | PASS | PASS |  |
| NW07 | Search validation | No | PASS | PASS |  |
| NW08 | Search validation | No | PASS | PASS |  |
| NW09 | Search validation | No | PASS | PASS |  |
| NW10 | Search | Yes | PASS | PASS |  |
| NW11 | Search | No | PASS | PASS |  |
| NW12 | Filter: min price | No | PASS | PASS |  |
| NW13 | Filter: max price | No | PASS | FAIL | results line should read "3 properties found" (found "2 properties found") |
| NW14 | Filter: max price | No | PASS | PASS |  |
| NW15 | Filter: star rating | No | PASS | PASS |  |
| NW16 | Filter: property type | No | PASS | PASS |  |
| NW17 | Filter: amenities | No | PASS | PASS |  |
| NW18 | Filter: amenities | No | PASS | PASS |  |
| NW19 | Filter: combined | No | PASS | PASS |  |
| NW20 | Filter: clear filters | No | PASS | FAIL | checkbox Pool should be unticked (it is ticked) |
| NW21 | Sort | No | PASS | PASS |  |
| NW22 | Sort | No | PASS | PASS |  |
| NW23 | Sort | No | PASS | PASS |  |
| NW24 | Sort | No | PASS | PASS |  |
| NW25 | Property details | Yes | PASS | PASS |  |
| NW26 | Booking | Yes | PASS | PASS |  |
| NW27 | Booking | No | PASS | FAIL | "Total: S$1,110" should be shown |
| NW28 | Booking validation | No | PASS | PASS |  |
| NW29 | Booking validation | No | PASS | PASS |  |
| NW30 | Booking validation | No | PASS | PASS |  |
| NW31 | Confirmation | No | PASS | PASS |  |
| NW32 | My bookings | Yes | PASS | PASS |  |
| NW33 | My bookings | No | PASS | PASS |  |
| NW34 | My bookings | No | PASS | PASS |  |

## New feature rows (Chromium 149.0.7827.55)

| StepID | Build 1.1.0 (v2) | Build 1.0.0 (v1, control: feature absent) |
|---|---|---|
| NW35 | PASS | FAIL (expected) |
| NW36 | PASS | FAIL (expected) |
| NW37 | PASS | FAIL (expected) |
| NW38 | PASS | FAIL (expected) |

## Page audit

Each page was opened (signed-in pages with `?as=tester`; the OTP page through a real login). Checked: the banner text is visible at the very top, the footer reads the right build label, every input/select/textarea has a `<label for>`, and there are no page errors, console errors, dialogs or external requests.

| Page | Result | Notes |
|---|---|---|
| v1/book.html | PASS |  |
| v1/bookings.html | PASS |  |
| v1/confirmation.html | PASS |  |
| v1/details.html | PASS |  |
| v1/index.html | PASS |  |
| v1/login.html | PASS |  |
| v1/otp.html | PASS |  |
| v1/results.html | PASS |  |
| v1/search.html | PASS |  |
| v2/book.html | PASS |  |
| v2/bookings.html | PASS |  |
| v2/confirmation.html | PASS |  |
| v2/details.html | PASS |  |
| v2/index.html | PASS |  |
| v2/login.html | PASS |  |
| v2/otp.html | PASS |  |
| v2/results.html | PASS |  |
| v2/search.html | PASS |  |
| index.html (landing) | PASS |  |

## Deployed file scan

Scanned 26 files under `docs/` (contents and file names) for words that could reveal the Build 1.1.0 changes, absolute URLs, `alert()`/`confirm()`/`prompt()`, `Math.random`, images, iframes, CSS imports and leftover build tokens.

No findings.

External requests seen across every run: none.

## Test sheet checks

| Check | Result | Detail |
|---|---|---|
| Northwind_Tests_Build_1.0.0.xlsx: worksheets | PASS | Tests, How to use |
| Northwind_Tests_Build_1.0.0.xlsx: columns in order | PASS | StepID, Persona, Feature, WhatToDo, TestData, ExpectedResult, Impact, Likelihood, RiskScore, Smoke, Status, RunDate, Notes |
| Northwind_Tests_Build_1.0.0.xlsx: table UATSteps | PASS | A1:M35, expected A1:M35 |
| Northwind_Tests_Build_1.0.0.xlsx: frozen header row | PASS | A2 |
| Northwind_Tests_Build_1.0.0.xlsx: wrapped text | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: StepIDs NWnn in sequence | PASS | NW01 to NW34 |
| Northwind_Tests_Build_1.0.0.xlsx: Impact/Likelihood 1-3, RiskScore = plain number Impact x Likelihood | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: no formulas | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: Smoke is Yes/No | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: Status starts as Not run, RunDate and Notes empty | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: exactly 6 smoke rows | PASS | NW01, NW06, NW10, NW25, NW26, NW32 |
| Northwind_Tests_Build_1.0.0.xlsx: every row starts with Open https://anishonly121.github.io/northwind-stays/v1/ | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: no row points at the other build | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: all dates in 2027 except the single past-date row | PASS | non-2027 dates in: NW09 |
| Northwind_Tests_Build_1.0.0.xlsx: non-login rows start on a signed-in page with ?as=tester | PASS |  |
| Northwind_Tests_Build_1.0.0.xlsx: Impact validation whole 1-3 | PASS | ('whole', '1', '3') |
| Northwind_Tests_Build_1.0.0.xlsx: Likelihood validation whole 1-3 | PASS | ('whole', '1', '3') |
| Northwind_Tests_Build_1.0.0.xlsx: Smoke validation Yes/No list | PASS | ('list', '"Yes,No"', None) |
| Northwind_Tests_Build_1.0.0.xlsx: Status validation Pass/Fail/Not run list | PASS | ('list', '"Pass,Fail,Not run"', None) |
| Northwind_Tests_Build_1.0.0.xlsx: How to use explains run order and self-contained rows | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: worksheets | PASS | Tests, How to use |
| Northwind_Tests_Build_1.1.0.xlsx: columns in order | PASS | StepID, Persona, Feature, WhatToDo, TestData, ExpectedResult, Impact, Likelihood, RiskScore, Smoke, Status, RunDate, Notes |
| Northwind_Tests_Build_1.1.0.xlsx: table UATSteps | PASS | A1:M35, expected A1:M35 |
| Northwind_Tests_Build_1.1.0.xlsx: frozen header row | PASS | A2 |
| Northwind_Tests_Build_1.1.0.xlsx: wrapped text | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: StepIDs NWnn in sequence | PASS | NW01 to NW34 |
| Northwind_Tests_Build_1.1.0.xlsx: Impact/Likelihood 1-3, RiskScore = plain number Impact x Likelihood | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: no formulas | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: Smoke is Yes/No | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: Status starts as Not run, RunDate and Notes empty | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: exactly 6 smoke rows | PASS | NW01, NW06, NW10, NW25, NW26, NW32 |
| Northwind_Tests_Build_1.1.0.xlsx: every row starts with Open https://anishonly121.github.io/northwind-stays/v2/ | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: no row points at the other build | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: all dates in 2027 except the single past-date row | PASS | non-2027 dates in: NW09 |
| Northwind_Tests_Build_1.1.0.xlsx: non-login rows start on a signed-in page with ?as=tester | PASS |  |
| Northwind_Tests_Build_1.1.0.xlsx: Impact validation whole 1-3 | PASS | ('whole', '1', '3') |
| Northwind_Tests_Build_1.1.0.xlsx: Likelihood validation whole 1-3 | PASS | ('whole', '1', '3') |
| Northwind_Tests_Build_1.1.0.xlsx: Smoke validation Yes/No list | PASS | ('list', '"Yes,No"', None) |
| Northwind_Tests_Build_1.1.0.xlsx: Status validation Pass/Fail/Not run list | PASS | ('list', '"Pass,Fail,Not run"', None) |
| Northwind_Tests_Build_1.1.0.xlsx: How to use explains run order and self-contained rows | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: worksheets | PASS | Tests, How to use |
| Northwind_NewFeature_Rows_1.1.0.xlsx: columns in order | PASS | StepID, Persona, Feature, WhatToDo, TestData, ExpectedResult, Impact, Likelihood, RiskScore, Smoke, Status, RunDate, Notes |
| Northwind_NewFeature_Rows_1.1.0.xlsx: table UATSteps | PASS | A1:M5, expected A1:M5 |
| Northwind_NewFeature_Rows_1.1.0.xlsx: frozen header row | PASS | A2 |
| Northwind_NewFeature_Rows_1.1.0.xlsx: wrapped text | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: StepIDs NWnn in sequence | PASS | NW35 to NW38 |
| Northwind_NewFeature_Rows_1.1.0.xlsx: Impact/Likelihood 1-3, RiskScore = plain number Impact x Likelihood | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: no formulas | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: Smoke is Yes/No | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: Status starts as Not run, RunDate and Notes empty | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: every row starts with Open https://anishonly121.github.io/northwind-stays/v2/ | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: no row points at the other build | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: all dates in 2027 except the single past-date row | PASS | non-2027 dates in: none |
| Northwind_NewFeature_Rows_1.1.0.xlsx: non-login rows start on a signed-in page with ?as=tester | PASS |  |
| Northwind_NewFeature_Rows_1.1.0.xlsx: Impact validation whole 1-3 | PASS | ('whole', '1', '3') |
| Northwind_NewFeature_Rows_1.1.0.xlsx: Likelihood validation whole 1-3 | PASS | ('whole', '1', '3') |
| Northwind_NewFeature_Rows_1.1.0.xlsx: Smoke validation Yes/No list | PASS | ('list', '"Yes,No"', None) |
| Northwind_NewFeature_Rows_1.1.0.xlsx: Status validation Pass/Fail/Not run list | PASS | ('list', '"Pass,Fail,Not run"', None) |
| Northwind_NewFeature_Rows_1.1.0.xlsx: How to use explains run order and self-contained rows | PASS |  |
| Build 1.0.0 and 1.1.0 sheets have identical rows apart from the build in the URL | PASS |  |
| New feature rows continue the StepID numbering | PASS | NW35 follows NW34 |
| 3 or 4 new feature rows | PASS | 4 |
| About 30 core rows | PASS | 34 |
