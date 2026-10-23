@echo off
rem Double-click after copying the Test Runner agent's code block.
rem It saves the code, runs it with Playwright and copies the results back to the clipboard.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
if not exist "node_modules\@playwright\test" (
  echo First run on this PC: installing Playwright. This takes a few minutes.
  call npm ci
  if errorlevel 1 goto failed
  call npx playwright install chromium
  if errorlevel 1 goto failed
)
node tools\run-agent-tests.js %*
pause
exit /b 0
:failed
echo Setup failed. Check your internet connection and run this again.
pause
exit /b 1
