@echo off
title SportBid - Stop Services

echo ==============================================================================
echo                      SPORTBID SHUTDOWN SCRIPT                                 
echo ==============================================================================
echo.
echo [*] Stopping services listening on ports 8000 and 3000...

:: Kill processes on port 8000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Terminating Backend process (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill processes on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [*] Terminating Frontend process (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] SportBid dev services have been stopped.
timeout /t 3 >nul
