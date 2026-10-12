/*
 * Results reporter for the Northwind Stays UAT runner.
 *
 * After every run it writes results/results.csv and results/results.md with one
 * row per test and these columns, in this order:
 *
 *   StepID, Feature, Status, Message, DurationSeconds, RunDate, Build
 *
 * - StepID and Feature come from the test title "<StepID> <Feature>" (for example
 *   "NW01 Login"). A title that does not start with a StepID is used whole as
 *   Feature, with StepID left blank.
 * - Status is Pass or Fail, taken from the final attempt. A test that only
 *   passed on a retry gets the Message "(retried)".
 * - Message is empty on a pass. On a fail it is a short plain-English summary of
 *   the first error (expected and received values included), 300 characters at most.
 * - DurationSeconds is the final attempt, rounded to 1 decimal.
 * - RunDate is the date in Singapore, DD/MM/YYYY.
 * - Build is 1.0.0 when the test opened a /v1/ URL, 1.1.0 for /v2/, otherwise unknown.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const COLUMNS = ['StepID', 'Feature', 'Status', 'Message', 'DurationSeconds', 'RunDate', 'Build'];
const MAX_MESSAGE = 300;
const MAX_VALUE = 110;
const TITLE_PATTERN = /^([A-Za-z]{1,6}-?\d{1,6})\s+(\S.*)$/;

const MATCHER_TEXT = {
  toHaveText: 'Text did not match',
  toContainText: 'Text did not contain the expected text',
  toBeVisible: 'Element was not visible',
  toBeHidden: 'Element was still visible',
  toBeChecked: 'Checkbox state was wrong',
  toHaveValue: 'Field value did not match',
  toBeEmpty: 'Field was not empty',
  toHaveCount: 'Number of matching elements was wrong',
  toHaveURL: 'Page address did not match',
  toHaveTitle: 'Page title did not match',
  toBeEnabled: 'Element was not enabled',
  toBeDisabled: 'Element was not disabled',
  toBeAttached: 'Element was not on the page',
  toHaveAttribute: 'Attribute did not match',
  toBe: 'Value did not match',
  toEqual: 'Value did not match',
  toContain: 'Value did not contain the expected item',
  toBeTruthy: 'Value was not true',
  toBeFalsy: 'Value was not false'
};

const NEGATED_TEXT = {
  toHaveText: 'Text matched but should be different',
  toContainText: 'Text contained something it should not',
  toBeVisible: 'Element was visible but should not be',
  toBeHidden: 'Element was hidden but should be visible',
  toBeChecked: 'Checkbox state was wrong',
  toHaveValue: 'Field value matched but should be different',
  toHaveCount: 'Number of matching elements was wrong',
  toHaveURL: 'Page address matched but should be different',
  toBe: 'Value matched but should be different',
  toEqual: 'Value matched but should be different'
};

const ACTION_TEXT = {
  click: 'click', dblclick: 'double-click', fill: 'type into', type: 'type into', pressSequentially: 'type into',
  check: 'tick', uncheck: 'untick', setChecked: 'set', selectOption: 'choose an option in', press: 'press a key in',
  hover: 'hover over', focus: 'focus', clear: 'clear', innerText: 'read', textContent: 'read', inputValue: 'read',
  isChecked: 'read', isVisible: 'find', waitFor: 'find', count: 'count'
};

/* ---------------- text helpers ---------------- */

function stripAnsi(text) {
  return String(text || '').replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
}

function oneLine(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function clip(text, max) {
  const value = oneLine(text);
  return value.length <= max ? value : value.slice(0, max - 3).trimEnd() + '...';
}

function seconds(ms) {
  // For sentences: 8 rather than 8.0.
  return (Math.round(Number(ms) / 100) / 10).toString();
}

function oneDecimal(value) {
  return (Math.round(Number(value) * 10) / 10).toFixed(1);
}

function field(lines, name) {
  // Matches "Expected: x", "Expected string: x", "Received pattern: x" and so on.
  const pattern = new RegExp('^' + name + '(?: [a-z ]+)?:\\s*(.*)$');
  for (const line of lines) {
    const match = pattern.exec(line.trim());
    if (match) return { label: line.trim().slice(0, line.trim().indexOf(':')), value: match[1].trim() };
  }
  return null;
}

function waitingFor(lines) {
  for (const line of lines) {
    const match = /^\s*-\s*waiting for (.+)$/.exec(line);
    if (match) return match[1].trim();
  }
  return '';
}

/* ---------------- error summaries ---------------- */

function describeExpect(headline, lines) {
  const match = /expect\((\w+)\)\.(not\.)?(\w+)\(/.exec(headline);
  if (!match) return '';
  const negated = Boolean(match[2]);
  const matcher = match[3];
  const locator = field(lines, 'Locator');
  const expected = field(lines, 'Expected');
  let received = field(lines, 'Received');
  if (!received && lines.some(function (l) { return /element\(s\) not found/.test(l); })) {
    received = { label: 'Received', value: 'element not found on the page' };
  }

  let text = negated
    ? NEGATED_TEXT[matcher] || 'Check not.' + matcher + ' failed'
    : MATCHER_TEXT[matcher] || 'Check ' + matcher + ' failed';
  if (locator) text += ' for ' + clip(locator.value, MAX_VALUE);
  text += '.';
  [expected, received].forEach(function (item) {
    if (!item) return;
    const value = clip(item.value, MAX_VALUE);
    text += ' ' + item.label + ': ' + value + (value.endsWith('...') ? '' : '.');
  });
  return text;
}

function describeAction(headline, lines) {
  const match = /^(?:locator|page|frame|elementHandle|keyboard|mouse)\.(\w+): (.*)$/.exec(headline);
  if (!match) return '';
  const action = match[1];
  const rest = match[2].replace(/^Error: /, '');
  const verb = ACTION_TEXT[action] || action;
  const target = waitingFor(lines);

  const strict = /strict mode violation: (.+?) resolved to (\d+) elements/.exec(rest);
  if (strict) {
    return clip(strict[1], MAX_VALUE) + ' matches ' + strict[2] + ' elements on the page, so the test cannot tell which one to ' +
      verb + '. Make the locator more specific.';
  }
  const timeout = /[Tt]imeout (?:of )?(\d+)ms exceeded/.exec(rest);
  if (timeout) {
    return 'Could not ' + verb + ' ' + (target ? clip(target, MAX_VALUE) : 'the element') +
      ': it was not found or not ready within ' + seconds(timeout[1]) + ' seconds.';
  }
  if (action === 'goto') return 'Could not open the page: ' + clip(rest, 200);
  return 'Could not ' + verb + (target ? ' ' + clip(target, MAX_VALUE) : '') + ': ' + clip(rest, 160);
}

function describeError(raw) {
  const lines = stripAnsi(raw).split(/\r?\n/);
  const stackStart = lines.findIndex(function (l) { return /^\s+at .+[(:]\d+:\d+\)?$/.test(l); });
  const body = stackStart === -1 ? lines : lines.slice(0, stackStart);
  const headline = oneLine((body.find(function (l) { return l.trim(); }) || '').replace(/^(?:\w*Error): /, ''));
  return describeExpect(headline, body) || describeAction(headline, body) || headline || 'The test failed without an error message.';
}

function summarizeErrors(errors, root) {
  const messages = (errors || []).map(function (e) { return stripAnsi(e && (e.message || e.value || e.stack) || ''); })
    .map(function (m) { return root ? m.split(root + path.sep).join('').split(root + '/').join('') : m; })
    .filter(function (m) { return m.trim(); });
  if (!messages.length) return 'The test failed without an error message.';

  const timedOut = /^Test timeout of (\d+)ms exceeded/.exec(messages[0].trim());
  let summary;
  if (timedOut) {
    summary = 'Test timed out after ' + seconds(timedOut[1]) + ' seconds.';
    if (messages[1]) summary += ' ' + describeError(messages[1]);
  } else {
    summary = describeError(messages[0]);
  }
  return clip(summary, MAX_MESSAGE);
}

/* ---------------- row building ---------------- */

function splitTitle(title) {
  const match = TITLE_PATTERN.exec(String(title || '').trim());
  return match ? { stepId: match[1], feature: match[2].trim() } : { stepId: '', feature: String(title || '').trim() };
}

function buildFromText(text) {
  const match = /\/v([12])\//.exec(String(text || ''));
  if (!match) return '';
  return match[1] === '1' ? '1.0.0' : '1.1.0';
}

function buildFromSteps(steps) {
  for (const step of steps || []) {
    const found = buildFromText(step.title) || buildFromSteps(step.steps);
    if (found) return found;
  }
  return '';
}

function buildFromSource(test) {
  // Fallback for a test that never reached a navigation step: read the URL from its source.
  try {
    const lines = fs.readFileSync(test.location.file, 'utf8').split(/\r?\n/);
    const start = test.location.line - 1;
    let end = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^\s*test(?:\.\w+)*\(/.test(lines[i])) { end = i; break; }
    }
    return buildFromText(lines.slice(start, end).join('\n'));
  } catch (e) {
    return '';
  }
}

function singaporeDate(date) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', day: '2-digit', month: '2-digit', year: 'numeric' })
    .formatToParts(date).reduce(function (acc, part) { acc[part.type] = part.value; return acc; }, {});
  return parts.day + '/' + parts.month + '/' + parts.year;
}

function csvCell(value) {
  const text = String(value === null || value === undefined ? '' : value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function mdCell(value) {
  return String(value === null || value === undefined ? '' : value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/* ---------------- reporter ---------------- */

class ResultsReporter {
  constructor(options) {
    this.options = options || {};
    this.runErrors = [];
  }

  printsToStdio() {
    return true;
  }

  onBegin(config, suite) {
    this.suite = suite;
    this.startedAt = new Date();
    const root = config.configFile ? path.dirname(config.configFile) : process.cwd();
    this.root = root;
    this.outputDir = path.resolve(root, this.options.outputDir || 'results');
    console.log('Running ' + suite.allTests().length + ' UAT test(s)');
  }

  onError(error) {
    this.runErrors.push(error);
  }

  onTestEnd(test, result) {
    const passed = result.status === 'passed';
    if (!passed && result.status !== 'skipped' && result.retry < test.retries) {
      console.log('  Retry ' + test.title + ' (attempt ' + (result.retry + 1) + ' failed, trying again)');
      return;
    }
    const label = passed ? 'Pass ' : 'Fail ';
    console.log('  ' + label + ' ' + test.title + ' (' + oneDecimal(result.duration / 1000) + 's)' + (passed && result.retry > 0 ? ' (retried)' : ''));
  }

  rowFor(test) {
    const title = splitTitle(test.title);
    const results = test.results || [];
    const last = results[results.length - 1];
    const outcome = test.outcome();
    let status = 'Fail';
    let message = '';

    if (!last) {
      message = 'The test did not run.';
    } else if (outcome === 'expected' && last.status === 'passed') {
      status = 'Pass';
    } else if (outcome === 'flaky') {
      status = 'Pass';
      message = '(retried)';
    } else if (last.status === 'skipped') {
      message = 'The test was skipped, so nothing was checked.';
    } else if (last.status === 'interrupted') {
      message = 'The run was stopped before this test finished.';
    } else {
      message = summarizeErrors(last.errors && last.errors.length ? last.errors : (last.error ? [last.error] : []));
    }

    return {
      StepID: title.stepId,
      Feature: title.feature,
      Status: status,
      Message: message,
      DurationSeconds: oneDecimal((last ? last.duration : 0) / 1000),
      RunDate: singaporeDate(last ? last.startTime : this.startedAt),
      Build: (last && buildFromSteps(last.steps)) || buildFromSource(test) || 'unknown'
    };
  }

  onEnd() {
    const rows = this.suite.allTests().map(this.rowFor, this);
    const root = this.root;
    this.runErrors.forEach(function (error) {
      const where = error.location && error.location.file ? ' (' + path.basename(error.location.file) + ')' : '';
      rows.push({
        StepID: '', Feature: 'Run error' + where, Status: 'Fail', Message: summarizeErrors([error], root),
        DurationSeconds: '0.0', RunDate: singaporeDate(new Date()), Build: 'unknown'
      });
    });

    const failed = rows.filter(function (r) { return r.Status === 'Fail'; });
    const passed = rows.length - failed.length;
    const failedIds = failed.map(function (r) { return r.StepID || r.Feature; });
    const summary = 'Summary: ' + rows.length + ' total, ' + passed + ' passed, ' + failed.length + ' failed. Failed StepIDs: ' +
      (failedIds.length ? failedIds.join(', ') : 'none') + '.';
    const durations = rows.map(function (r) { return Number(r.DurationSeconds); });
    const average = durations.length ? durations.reduce(function (a, b) { return a + b; }, 0) / durations.length : 0;
    const timing = 'Average test duration: ' + oneDecimal(average) + ' seconds. Total run time: ' +
      oneDecimal((Date.now() - this.startedAt.getTime()) / 1000) + ' seconds.';

    const csv = [COLUMNS.join(',')].concat(rows.map(function (row) {
      return COLUMNS.map(function (name) { return csvCell(row[name]); }).join(',');
    })).join('\n') + '\n';

    const md = ['# UAT test results', '', summary, '', timing, '',
      '| ' + COLUMNS.join(' | ') + ' |',
      '|' + COLUMNS.map(function () { return '---'; }).join('|') + '|']
      .concat(rows.map(function (row) {
        return '| ' + COLUMNS.map(function (name) { return mdCell(row[name]); }).join(' | ') + ' |';
      })).join('\n') + '\n';

    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'results.csv'), csv, 'utf8');
    fs.writeFileSync(path.join(this.outputDir, 'results.md'), md, 'utf8');

    console.log('');
    failed.forEach(function (row) { console.log('  Fail  ' + (row.StepID || row.Feature) + ': ' + row.Message); });
    console.log(summary);
    console.log(timing);
    console.log('Results written to ' + path.relative(process.cwd(), path.join(this.outputDir, 'results.csv')) + ' and ' +
      path.relative(process.cwd(), path.join(this.outputDir, 'results.md')));
  }
}

module.exports = ResultsReporter;
