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
if exist "%CHROME%" start "" "%CHROME%" "chrome://extensions/"

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" start "" "%EDGE%" "edge://extensions/"

echo.
pause
endlocal
