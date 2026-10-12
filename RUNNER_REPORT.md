# Northwind Stays test runner report

Checked on 12/10/2026 (Singapore date). Playwright Test 1.61.0, Chromium, 1280x800, 1 worker, 1 retry, 30 second test timeout. Local runs were on Windows against the live site at https://anishonly121.github.io/northwind-stays. GitHub Actions runs were on `ubuntu-24.04` with Node LTS.

**Overall result: every required check passed.** One item was confirmed indirectly: the job summary could not be viewed in a signed-in browser from this session, so its content was read from the step log and its table rendering was confirmed with GitHub's Markdown API (see check 5).

## Required checks

| # | Check | Expected | Result |
|---|---|---|---|
| 1 | `tests/sample/smoke.v1.spec.js`, local, live site | all 6 pass | 6/6 pass |
| 2 | `tests/sample/smoke.v2.spec.js`, local, live site | all 6 pass | 6/6 pass |
| 3 | `tests/sample/regressions.v2.spec.js`, local, live site | all 3 fail, Message shows expected versus received | 3/3 fail, messages below |
| 4 | `results/results.csv` columns and Build values | exact columns in order, Build correct | pass, 10 structural checks on each of 3 files |
| 5 | Workflow run with suite "sample" started with `gh` | artifacts exist, job summary shows the table | 3 artifacts present, summary table written |
| - | Existing `verify/` check, unchanged | still passes | pass (34/34 on v1, only NW13, NW20, NW27 fail on v2, in Chromium, Edge and Edge on the live site) |

## Check 3: failure messages

| StepID | Message |
|---|---|
| NW13 | Text did not match for getByText(/propert(y\|ies) found\|No properties match/). Expected: "3 properties found". Received: "2 properties found". |
| NW20 | Checkbox state was wrong for getByLabel('Pool', { exact: true }). Expected: not checked. Received: checked. |
| NW27 | Text did not match for getByText(/^Total: /). Expected: "Total: S$1,110". Received: "Total: S$555". |

Each of these failed on the first attempt and again on the retry, so the Status is the final result after retries.

## Check 4: results.csv

Checked with a CSV parser on the output of all three local runs:

- Header is exactly `StepID,Feature,Status,Message,DurationSeconds,RunDate,Build`, with no byte-order mark.
- Every row has 7 cells. Messages containing commas or quotes are quoted correctly.
- Status is Pass or Fail. Message is empty on every Pass and filled on every Fail.
- Messages are at most 300 characters, with no colour codes and no stack trace.
- DurationSeconds has 1 decimal. RunDate is DD/MM/YYYY.
- Build is 1.0.0 for every row of `smoke.v1` and 1.1.0 for every row of `smoke.v2` and `regressions.v2`.

## Check 5: GitHub Actions

| Run | Started by | Suite | Result | Wall time |
|---|---|---|---|---|
| [38258877863](https://github.com/anishonly121/northwind-stays/actions/runs/38258877863) | push that changed `tests/agent/**` | agent | success, 1/1 pass | 38 s |
| [38259009655](https://github.com/anishonly121/northwind-stays/actions/runs/38259009655) | `gh workflow run`, suite=sample, build=v2 | sample | failure, as intended: 12 pass, 3 fail | 1 min 30 s |
| [38259399010](https://github.com/anishonly121/northwind-stays/actions/runs/38259399010) | `gh workflow run`, suite=sample, build=v2 | sample | failure, as intended: 12 pass, 3 fail | 1 min 31 s |

The sample suite ends in "failure" on purpose. It includes the three rows that do not pass on Build 1.1.0, and a run is red whenever at least one test fails. In both sample runs the test step failed and every later step still ran.

Artifacts on the last sample run, all expiring after 14 days (26/10/2026):

| Artifact | Size | Contents |
|---|---|---|
| `uat-results` | 1.2 KB | `results.csv`, `results.md` |
| `playwright-report` | 7.5 MB | Playwright HTML report |
| `test-videos` | 7.1 MB | a video of every test, plus a trace and screenshot for each failure |

`uat-results` was downloaded and checked: 15 rows, same columns, Build 1.0.0 for the six v1 rows and 1.1.0 for the nine v2 rows.

Job summary: the "Write results to the run summary" step succeeded in every run. From run 38259399010 on, that step also prints what it writes, and its log shows the full results table going into the summary. The same Markdown, sent through GitHub's Markdown API, renders as one table with 7 header cells and 15 rows. GitHub does not show run summaries to signed-out visitors, so the Summary page itself was not viewed from this session. Open the run link above while signed in to see it.

## Timing, from the last sample run in GitHub Actions

| Measure | Value |
|---|---|
| Average test duration, all 15 tests | 1.7 seconds |
| Average, the 12 passing tests | 0.6 seconds |
| Average, the 3 failing tests | 5.9 seconds |
| Test execution for all 15 tests, including retries and video | 47.3 seconds |
| Whole workflow, from start to artifacts uploaded | 1 minute 31 seconds |

A failing check waits 5 seconds for the page to change before giving up, which is why failing tests take longer. DurationSeconds is the final attempt only. About 43 seconds of each workflow run is fixed overhead that does not grow with the number of tests: about 34 seconds before the tests start (mostly the Chromium install, 22 seconds) and about 9 seconds to upload the results afterwards.

Local runs on Windows were slower on first contact with the site: 2.6 seconds average for `smoke.v1` and 0.9 seconds for `smoke.v2`.

## Reporter behaviour also checked

These were run with temporary test files that are not in the repository:

| Case | Result in results.csv |
|---|---|
| Test fails first, passes on the retry | Status Pass, Message `(retried)` |
| Title with no StepID | StepID blank, whole title in Feature |
| Test that never opens a page | Build `unknown` |
| Test that fails before opening its page | Build read from the URL in the test's source |
| `test.skip` | Status Fail, Message says the test was skipped and nothing was checked |
| Spec file with a syntax error | No test runs. One "Run error" row names the file and the error |
| `test.only` in GitHub Actions | No test runs. One "Run error" row says `.only` is not allowed |
| Empty folder | One "Run error" row: No tests found |
| Timeout, element not found, locator matching several elements, wrong URL, wrong count | Short plain-English message with expected and received values where Playwright gives them |
| `import` instead of `require` | Works |

## Decisions worth knowing

- `@playwright/test` is pinned to 1.61.0, so local runs and GitHub Actions use the same Chromium.
- The workflow runs on `ubuntu-24.04` rather than `ubuntu-latest`. GitHub's log announced that `ubuntu-latest` moves to Ubuntu 26 from 19 October 2026, which Playwright 1.61.0 has not been tested on.
- A newer run cancels one that is still going. A "Cancelled" run in the list is normal if you click Run workflow right after a push.
- The results reporter prints one line per test, so no extra console reporter was added to the two in the config.
- Nothing under `docs/` changed, so nothing new is published to GitHub Pages. `ANSWER_KEY.md` is not read, printed or uploaded by the workflow.
