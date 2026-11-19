@echo off
title Lumina Library Management System
echo ======================================================================
echo    Launching Lumina Library in Native App Window Mode...
echo ======================================================================

set "HTML_FILE=%~dp0index.html"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE%" (
    start "" "%EDGE%" --app="%HTML_FILE%"
    exit /b
)

if exist "%CHROME%" (
    start "" "%CHROME%" --app="%HTML_FILE%"
    exit /b
)

start "" "%HTML_FILE%"
exit /b
