#!/usr/bin/env node
/*
 * One-click runner for the Test Runner agent's code.
 *
 *   1. Takes the Playwright code the agent wrote: from a file given on the
 *      command line, or from the clipboard (copy the agent's code block first).
 *   2. Saves it as tests/agent/agent-latest.spec.js.
 *   3. Runs only that file with Playwright.
 *   4. Copies results/results.md to the clipboard, ready to paste back into the
 *      Test Runner (JOB 2) or the Defect Desk.
 *
 * Usage:  node tools/run-agent-tests.js            (reads the clipboard)
 *         node tools/run-agent-tests.js my.spec.js (reads a file)
 * On Windows, double-click run-agent-tests.bat in the repo root instead.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'tests', 'agent', 'agent-latest.spec.js');
const RESULTS = path.join(ROOT, 'results', 'results.md');
const isWin = process.platform === 'win32';

function say(msg) { process.stdout.write(msg + '\n'); }

function readClipboard() {
  if (isWin) {
    const tmp = path.join(os.tmpdir(), 'agent-clipboard-' + process.pid + '.txt');
    const ps = "$t = Get-Clipboard -Raw; if ($null -eq $t) { $t = '' }; " +
      "[System.IO.File]::WriteAllText('" + tmp.replace(/'/g, "''") + "', $t, (New-Object System.Text.UTF8Encoding $false))";
    const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8' });
    if (r.status !== 0 || !fs.existsSync(tmp)) return null;
    const text = fs.readFileSync(tmp, 'utf8');
    fs.unlinkSync(tmp);
    return text;
  }
  const cmd = process.platform === 'darwin' ? ['pbpaste', []] : ['xclip', ['-selection', 'clipboard', '-o']];
  const r = spawnSync(cmd[0], cmd[1], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

function copyFileToClipboard(file) {
  if (isWin) {
    const ps = "Set-Clipboard -Value (Get-Content -LiteralPath '" + file.replace(/'/g, "''") + "' -Raw -Encoding UTF8)";
    return spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps]).status === 0;
  }
  const text = fs.readFileSync(file, 'utf8');
  const cmd = process.platform === 'darwin' ? ['pbcopy', []] : ['xclip', ['-selection', 'clipboard']];
  const r = spawnSync(cmd[0], cmd[1], { input: text });
  return r.status === 0;
}

// Keep only the code: drop ``` fences and anything the user copied around them.
function cleanCode(text) {
  let code = text.replace(/\r\n/g, '\n');
  const fenced = code.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fenced) code = fenced[1];
  code = code.replace(/\btest\.only\(/g, 'test(');
  return code.trim() + '\n';
}

function checkCode(code) {
  const problems = [];
  if (!/@playwright\/test/.test(code)) problems.push("it doesn't load @playwright/test");
  if (!/\btest\s*\(/.test(code)) problems.push('it has no test( ... ) blocks');
  return problems;
}

function main() {
  const fromFile = process.argv[2];
  let text;
  if (fromFile) {
    if (!fs.existsSync(fromFile)) { say('File not found: ' + fromFile); return 1; }
    text = fs.readFileSync(fromFile, 'utf8');
  } else {
    text = readClipboard();
    if (text === null) { say("Couldn't read the clipboard. Copy the agent's code again, or pass a file: node tools/run-agent-tests.js my.spec.js"); return 1; }
  }

  const code = cleanCode(text);
  const problems = checkCode(code);
  if (problems.length) {
    say("This doesn't look like the Test Runner's code: " + problems.join(' and ') + '.');
    say("Copy the whole code block from the agent's reply (it starts with const { test, expect } = require('@playwright/test');) and try again.");
    return 1;
  }
  const count = (code.match(/\btest\s*\(\s*['"`]/g) || []).length;
  fs.writeFileSync(TARGET, code, 'utf8');
  say('Saved ' + count + ' test(s) to tests/agent/agent-latest.spec.js. Running them now...\n');

  if (fs.existsSync(RESULTS)) fs.unlinkSync(RESULTS);
  const npx = isWin ? 'npx.cmd' : 'npx';
  spawnSync(npx, ['playwright', 'test', 'tests/agent/agent-latest.spec.js'], { cwd: ROOT, stdio: 'inherit', shell: isWin });

  if (!fs.existsSync(RESULTS)) {
    say('\nNo results file was written. Check the messages above, then run again.');
    return 1;
  }
  const md = fs.readFileSync(RESULTS, 'utf8');
  const summary = (md.match(/^Summary:.*$/m) || [''])[0];
  say('\n' + (summary || 'Run finished.'));
  if (copyFileToClipboard(RESULTS)) {
    say('The results table is now on your clipboard. Paste it into the Test Runner and ask it to read the results.');
  } else {
    say('Results are in results/results.md. Open it and copy the table into the Test Runner.');
  }
  say('Videos and screenshots: run  npx playwright show-report');
  return 0;
}

process.exitCode = main();
