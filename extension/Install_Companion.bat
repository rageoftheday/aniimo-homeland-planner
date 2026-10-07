@echo off
setlocal EnableExtensions
title Aniimo Homeland Companion Installer

set "TARGET=%LOCALAPPDATA%\AniimoHomelandCompanion"
set "SOURCE=%~dp0"

echo.
echo ============================================================
echo          ANIIMO HOMELAND COMPANION INSTALLER
echo ============================================================
echo.
echo Permanent folder:
echo   %TARGET%
echo.

if not exist "%TARGET%" mkdir "%TARGET%" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Could not create the permanent folder.
  echo.
  pause
  exit /b 1
)

for %%F in (manifest.json background.js planner-bridge.js aniidex-isolated.js aniidex-main.js) do (
  if not exist "%SOURCE%%%F" (
    echo [ERROR] Missing %%F next to this installer.
    echo.
    pause
    exit /b 1
  )
  copy /Y "%SOURCE%%%F" "%TARGET%\%%F" >nul
  if errorlevel 1 (
    echo [ERROR] Failed to copy %%F.
    echo.
    pause
    exit /b 1
  )
)

echo [OK] Companion files copied to the permanent folder.
echo.
echo Next, load this folder ONCE as an unpacked extension:
echo   %TARGET%
echo.
echo Chrome:
echo   1. Turn on Developer mode.
echo   2. Click Load unpacked.
echo   3. Select the permanent folder opened in Explorer.
echo.
echo Edge:
echo   1. Turn on Developer mode.
echo   2. Click Load unpacked.
echo   3. Select the same permanent folder.
echo.

start "" explorer.exe "%TARGET%"

set "BROWSER_OPENED=0"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
tasklist /FI "IMAGENAME eq chrome.exe" 2>nul | find /I "chrome.exe" >nul
if not errorlevel 1 if exist "%CHROME%" (
  echo [INFO] Chrome is already open - opening chrome://extensions
  start "" "%CHROME%" --new-tab "chrome://extensions/"
  set "BROWSER_OPENED=1"
) else (
  echo [INFO] Chrome is not running - leaving it closed.
)

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
tasklist /FI "IMAGENAME eq msedge.exe" 2>nul | find /I "msedge.exe" >nul
if not errorlevel 1 if exist "%EDGE%" (
  echo [INFO] Edge is already open - opening edge://extensions
  start "" "%EDGE%" --new-tab "edge://extensions/"
  set "BROWSER_OPENED=1"
) else (
  echo [INFO] Edge is not running - leaving it closed.
)

if "%BROWSER_OPENED%"=="0" (
  echo.
  echo [NEXT STEP] No supported browser is currently open.
  echo Open Chrome or Edge when you are ready, then go to:
  echo   Chrome: chrome://extensions
  echo   Edge:   edge://extensions
  echo Turn on Developer mode, click Load unpacked, and select:
  echo   %TARGET%
)

echo.
echo [DONE] Files are installed permanently.
echo The browser must still use Load unpacked once for this folder.
echo.
pause
endlocal
