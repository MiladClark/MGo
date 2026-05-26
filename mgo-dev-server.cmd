@echo off
title MGo - Dev Server (do not close)
cd /d "%~dp0"

if not exist "package.json" (
  echo [MGo] package.json not found in: %CD%
  pause
  exit /b 1
)

color 4F
echo.
echo   ================================================================
echo.
echo        DO NOT CLOSE THIS WINDOW WHILE USING MGo
echo.
echo   ================================================================
echo.
color 07

call npm run mgo
if errorlevel 1 (
  echo.
  echo [MGo] Dev server stopped with an error.
  pause
)
