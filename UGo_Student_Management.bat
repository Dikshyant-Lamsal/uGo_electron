@echo off
title UGo Student Management System

REM Change to script directory
cd /d "%~dp0"

REM Run Python launcher
python src\launcher\app_launcher.py

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo An error occurred. Press any key to exit...
    pause > nul
)