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

set "BROWSER_OPENED=0"

tasklist /FI "IMAGENAME eq chrome.exe" 2>nul | find /I "chrome.exe" >nul
if not errorlevel 1 (
  echo [INFO] Chrome is running. Attempting to open extensions tab...
  powershell -c "$w=New-Object -ComObject Wscript.Shell; if ($w.AppActivate('Chrome')) { Start-Sleep -m 150; $w.SendKeys('^t'); Start-Sleep -m 150; $w.SendKeys('chrome://extensions/{ENTER}') }"
  set "BROWSER_OPENED=1"
) else (
  echo [INFO] Chrome is not running - skipping.
)

tasklist /FI "IMAGENAME eq msedge.exe" 2>nul | find /I "msedge.exe" >nul
if not errorlevel 1 (
  echo [INFO] Edge is running. Attempting to open extensions tab...
  powershell -c "$w=New-Object -ComObject Wscript.Shell; if ($w.AppActivate('Edge')) { Start-Sleep -m 150; $w.SendKeys('^t'); Start-Sleep -m 150; $w.SendKeys('edge://extensions/{ENTER}') }"
  set "BROWSER_OPENED=1"
) else (
  echo [INFO] Edge is not running - skipping.
)

if "%BROWSER_OPENED%"=="0" (
  echo.
  echo [NEXT STEP] No supported browser is currently open.
  echo Open Chrome or Edge when you are ready, then go to:
  echo   Chrome: chrome://extensions
  echo   Edge:   edge://extensions
  echo Click Reload on Aniimo Homeland Companion.
)

echo.
echo [DONE] Extension files are updated.
echo.
pause
endlocal
