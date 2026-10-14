@echo off
setlocal enabledelayedexpansion

title SportBid - Unified Dev Server Launcher

echo ==============================================================================
echo                      SPORTBID UNIFIED DEV LAUNCHER                            
echo ==============================================================================
echo.

:: Ensure working directory is the script root
cd /d "%~dp0"
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

:: -----------------------------------------------------------------------------
:: 1. Check & Setup Environment Files
:: -----------------------------------------------------------------------------
echo [*] Checking environment configurations...

if not exist "%BACKEND_DIR%\.env" (
    if exist "%ROOT_DIR%.env.example" (
        echo [!] backend\.env not found. Copying from .env.example...
        copy "%ROOT_DIR%.env.example" "%BACKEND_DIR%\.env" >nul
    ) else (
        echo [WARN] .env.example not found. Please ensure backend\.env is configured.
    )
) else (
    echo [OK] backend\.env present.
)

if not exist "%FRONTEND_DIR%\.env.local" (
    echo [!] frontend\.env.local not found. Creating default configuration...
    (
        echo NEXT_PUBLIC_APP_NAME=SportBid
        echo NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > "%FRONTEND_DIR%\.env.local"
    echo [OK] frontend\.env.local generated.
) else (
    echo [OK] frontend\.env.local present.
)

:: -----------------------------------------------------------------------------
:: 2. Check Backend Virtual Environment & Dependencies
:: -----------------------------------------------------------------------------
echo.
echo [*] Checking Python backend environment...

if not exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
    echo [!] Virtual environment not detected at backend\venv.
    echo [*] Creating Python virtual environment...
    python -m venv "%BACKEND_DIR%\venv"
    if errorlevel 1 (
        echo [ERROR] Failed to create Python virtual environment. Please ensure Python 3.11+ is installed and on your PATH.
        pause
        exit /b 1
    )
    echo [*] Installing backend dependencies from requirements.txt...
    "%BACKEND_DIR%\venv\Scripts\python.exe" -m pip install --upgrade pip
    "%BACKEND_DIR%\venv\Scripts\pip.exe" install -r "%BACKEND_DIR%\requirements.txt"
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
    echo [OK] Backend virtual environment created and packages installed.
) else (
    echo [OK] Backend virtual environment found at backend\venv.
)

:: -----------------------------------------------------------------------------
:: 3. Check Frontend Dependencies
:: -----------------------------------------------------------------------------
echo.
echo [*] Checking Node.js frontend environment...

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [!] frontend\node_modules not found. Running npm install...
    cd /d "%FRONTEND_DIR%"
    call npm install
    cd /d "%ROOT_DIR%"
    if errorlevel 1 (
        echo [ERROR] npm install in frontend failed.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed.
) else (
    echo [OK] Frontend node_modules present.
)

:: -----------------------------------------------------------------------------
:: 4. Launch Backend and Frontend in Dedicated Windows
:: -----------------------------------------------------------------------------
echo.
echo ==============================================================================
echo [*] Starting Services...
echo ==============================================================================

:: Start FastAPI Backend
echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "SportBid - Backend (FastAPI :8000)" cmd /k "title SportBid Backend (FastAPI :8000) && cd /d "%BACKEND_DIR%" && call venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Start Next.js Frontend
echo [2/2] Launching Next.js Frontend on http://localhost:3000 ...
start "SportBid - Frontend (Next.js :3000)" cmd /k "title SportBid Frontend (Next.js :3000) && cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo ==============================================================================
echo                     SPORTBID IS NOW RUNNING!                                  
echo ==============================================================================
echo.
echo   Frontend App:        http://localhost:3000
echo   Backend API:         http://localhost:8000
echo   Interactive Docs:    http://localhost:8000/docs
echo   Health Endpoint:     http://localhost:8000/api/v1/health
echo.
echo   To stop both servers, close their terminal windows or run: stop.bat
echo ==============================================================================
echo.

:: Automatically prompt to open frontend in default browser
set /p OPEN_BROWSER="Do you want to open http://localhost:3000 in your browser? (Y/N, default Y): "
if /i "!OPEN_BROWSER!"=="" set OPEN_BROWSER=Y
if /i "!OPEN_BROWSER!"=="Y" (
    echo Opening browser...
    start http://localhost:3000
)

echo.
echo Launcher completed. Services are running in separate windows.
timeout /t 5 >nul
exit /b 0
