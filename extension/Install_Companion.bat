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

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" start "" "%CHROME%" "chrome://extensions/"

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" start "" "%EDGE%" "edge://extensions/"

echo.
echo [DONE] Files are installed permanently.
echo The browser must still use Load unpacked once for this folder.
echo.
pause
endlocal
