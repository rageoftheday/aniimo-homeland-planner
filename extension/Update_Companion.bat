@echo off
setlocal EnableExtensions
title Aniimo Homeland Companion Updater

set "TARGET=%LOCALAPPDATA%\AniimoHomelandCompanion"
set "SOURCE=%~dp0"

echo.
echo ============================================================
echo           ANIIMO HOMELAND COMPANION UPDATER
echo ============================================================
echo.

if not exist "%TARGET%\manifest.json" (
  echo [INFO] Permanent install was not found.
  echo Running the installer instead...
  echo.
  call "%SOURCE%Install_Companion.bat"
  exit /b %errorlevel%
)

for %%F in (manifest.json background.js planner-bridge.js aniidex-isolated.js aniidex-main.js) do (
  if not exist "%SOURCE%%%F" (
    echo [ERROR] Missing %%F next to this updater.
    echo.
    pause
    exit /b 1
  )
  copy /Y "%SOURCE%%%F" "%TARGET%\%%F" >nul
  if errorlevel 1 (
    echo [ERROR] Failed to update %%F.
    echo.
    pause
    exit /b 1
  )
)

echo [OK] Extension files updated in:
echo   %TARGET%
echo.
echo Chrome / Edge already remember this unpacked folder.
echo Open the extensions page and click Reload on Aniimo Homeland Companion.
echo.

start "" explorer.exe "%TARGET%"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
tasklist /FI "IMAGENAME eq chrome.exe" 2>nul | find /I "chrome.exe" >nul
if not errorlevel 1 if exist "%CHROME%" (
  echo [INFO] Chrome is already open - opening chrome://extensions
  start "" "%CHROME%" "chrome://extensions/"
) else (
  echo [INFO] Chrome is not running - leaving it closed.
)

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
tasklist /FI "IMAGENAME eq msedge.exe" 2>nul | find /I "msedge.exe" >nul
if not errorlevel 1 if exist "%EDGE%" (
  echo [INFO] Edge is already open - opening edge://extensions
  start "" "%EDGE%" "edge://extensions/"
) else (
  echo [INFO] Edge is not running - leaving it closed.
)

echo.
pause
endlocal
