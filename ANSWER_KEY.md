# Northwind Stays: answer key (test team only)

This file is never deployed: GitHub Pages serves only `docs/`, and nothing under `docs/` mentions what follows.

Build 1.0.0 (`docs/v1/`) is the correct baseline. Build 1.1.0 (`docs/v2/`) adds the Free cancellation feature from the release notes. It also contains three planted regressions that the release notes don't mention. Both builds come from the same source. Lines between `//#if v1` and `//#if v2` markers in `src/app.js` (and `<!--#if v2-->` in `src/pages/results.html` and `details.html`) are selected by `build.js`, and the markers are stripped from the deployed files.

## The three regressions

| ID | What is wrong in Build 1.1.0 | Code (`src/app.js`) | Failing row |
|---|---|---|---|
| R1 | The booking total ignores the number of rooms: Total = price per night × nights, instead of price × nights × rooms. Wrong on the Book page and the Confirmation page (and so in My bookings). | `stayTotal()` | **NW27** |
| R2 | The max price filter drops properties priced exactly at the maximum (`>=` instead of `>`, so the boundary is exclusive). | `matchesFilters()` | **NW13** |
| R3 | Clear filters resets everything except the Amenities checkboxes, which stay ticked. The results are then still filtered by those amenities. | `resetFilterInputs()` | **NW20** |

### R1: booking total ignores rooms

Reproduce on v2:
1. Open `/v2/results.html?as=tester&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=2`.
2. Click **View details** on Lantern Quay Hotel (S$185 per night), then **Book now**.
3. The summary shows `Nights: 3`, `Rooms: 2` but `Total: S$555`. Build 1.0.0 shows `Total: S$1,110` (185 × 3 × 2).
4. Fill in the form and click **Confirm booking**. The confirmation also shows `Total: S$555`.

Fails: **NW27**. Not caught by NW26 (smoke), NW31, NW32 or NW33, because those book 1 room, where both formulas give the same total.

### R2: max price boundary is exclusive

Reproduce on v2:
1. Open `/v2/results.html?as=tester&city=Singapore&checkin=12/03/2027&checkout=15/03/2027&guests=2&rooms=1`.
2. Type `200` into **Max price per night (S$)** and click **Apply filters**.
3. v2 shows `2 properties found` (Lantern Quay Hotel, Kestrel Garden Inn). Tidewater Residences, priced exactly S$200, is missing. Build 1.0.0 shows `3 properties found`.

Fails: **NW13**. NW14 (Bangkok, max S$200) passes on both builds because no Bangkok property costs exactly S$200. That shows the bug only appears at the boundary. NW12 (min price S$200) also passes on both builds because the min boundary is still inclusive.

### R3: Clear filters leaves amenities ticked

Reproduce on v2:
1. Open the Singapore results URL above.
2. Tick **4 stars** and **Pool**, then click **Apply filters**. Both builds show `1 property found` (Lantern Quay Hotel).
3. Click **Clear filters**. v2 unticks 4 stars, but **Pool stays ticked** and the page shows `2 properties found`. Build 1.0.0 unticks everything and shows `4 properties found`.

Fails: **NW20**. NW38 (Free cancellation + Hotel, then Clear filters) passes on v2 because it ticks no amenities.

## Expected results per sheet

| Sheet | Expected outcome |
|---|---|
| `sheets/Northwind_Tests_Build_1.0.0.xlsx` (NW01-NW34 on v1) | All 34 rows pass. |
| `sheets/Northwind_Tests_Build_1.1.0.xlsx` (NW01-NW34 on v2) | 31 pass. **NW13, NW20 and NW27 fail.** |
| Smoke rows NW01, NW06, NW10, NW25, NW26, NW32 | Pass on both builds. None touches the max price boundary, Clear filters or multi-room totals. |
| `sheets/Northwind_NewFeature_Rows_1.1.0.xlsx` (NW35-NW38 on v2) | All 4 pass. On v1 they fail, because the feature doesn't exist there. |

## New feature rows (answer key for the patch agent)

These are the rows a patch agent should roughly reproduce from `RELEASE_NOTES_1.1.0.md`:

| StepID | Covers |
|---|---|
| NW35 | Free cancellation filter on its own (Singapore: 3 properties found, Northwind Marina Suites, Kestrel Garden Inn, Tidewater Residences). |
| NW36 | Badge on result cards (Tokyo: Cedar Gate Hotel and Northwind Skyline Tokyo show it, Maple Crossing Apartments does not). |
| NW37 | Badge on the details page (Northwind Marina Suites). |
| NW38 | Free cancellation combined with Property type = Hotel (1 property found, Kestrel Garden Inn), then Clear filters unticks it (4 properties found). |

Good patch-agent rows should also: start with the full v2 URL, use `?as=tester`, quote exact on-screen text, and include at least one negative check (a property without the badge, or one excluded by the filter).

## Verifying

`node verify/verify.js` checks all of the above automatically and writes `VERIFY_REPORT.md`.
