@echo off
title Lumina Library Management System
echo ======================================================================
echo    Lumina Library Management System
echo ======================================================================

set "HTML_FILE=%~dp0index.html"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE%" (
    start "" "%EDGE%" --app="%HTML_FILE%"
    goto :done
)

if exist "%CHROME%" (
    start "" "%CHROME%" --app="%HTML_FILE%"
    goto :done
)

start "" "%HTML_FILE%"

:done
echo Application launched!
timeout /t 2 >nul
exit /b
