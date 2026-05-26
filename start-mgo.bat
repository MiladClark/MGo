@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "MGO_DIR=."
set "PORT=1420"
set "OPEN_BROWSER=1"

if exist "%~dp0start-mgo.dat" (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%~dp0start-mgo.dat") do (
    set "cfg_key=%%a"
    set "cfg_val=%%b"
    for /f "tokens=*" %%k in ("!cfg_key!") do set "cfg_key=%%k"
    for /f "tokens=*" %%v in ("!cfg_val!") do set "cfg_val=%%v"
    if /i "!cfg_key!"=="MGO_DIR" set "MGO_DIR=!cfg_val!"
    if /i "!cfg_key!"=="PORT" set "PORT=!cfg_val!"
    if /i "!cfg_key!"=="OPEN_BROWSER" set "OPEN_BROWSER=!cfg_val!"
  )
)

if /i not "%MGO_DIR%"=="." (
  cd /d "%~dp0%MGO_DIR%" 2>nul
  if errorlevel 1 (
    echo [MGo] Could not find project directory: %MGO_DIR%
    pause
    exit /b 1
  )
)

if not exist "package.json" (
  echo [MGo] package.json not found in: %CD%
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [MGo] Node.js is not installed or not in PATH.
  echo Install Node.js 20+ from https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [MGo] npm is not installed or not in PATH.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [MGo] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [MGo] npm install failed.
    pause
    exit /b 1
  )
)

echo [MGo] Starting dev server...
start "" cmd /k call "%~dp0mgo-dev-server.cmd"

set "URL=http://localhost:%PORT%"
set /a tries=0

:wait_loop
set /a tries+=1
if !tries! gtr 90 goto wait_fail

curl.exe -sf -o nul "%URL%" 2>nul
if not errorlevel 1 goto server_ready

powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri '%URL%' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto server_ready

ping -n 2 127.0.0.1 >nul
goto wait_loop

:wait_fail
echo [MGo] Server did not respond within 90 seconds at %URL%
echo Check the MGo server window for errors.
echo If port %PORT% is already in use, close the other process and try again.
pause
exit /b 1

:server_ready
if "%OPEN_BROWSER%"=="1" (
  start "" "%URL%"
  echo [MGo] Opened %URL% in your browser.
) else (
  echo [MGo] Server ready at %URL%
)
echo [MGo] Keep the MGo server window open while using the app.
exit /b 0
