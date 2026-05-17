@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   TrafficDetectionNN - Start Client & Server
echo ============================================
echo.

cd /d "%~dp0.."
set "PROJECT_ROOT=%CD%"

:: ========== Check .venv ==========
if not exist "backend\.venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at backend\.venv
    echo Please run scripts\setup_environment.bat first.
    pause
    exit /b 1
)

:: ========== Check node_modules ==========
if not exist "app\node_modules" (
    echo [ERROR] Node modules not found at app\node_modules
    echo Please run scripts\setup_environment.bat first.
    pause
    exit /b 1
)

echo [INFO] Starting Backend Server...

:: Write temp helper to avoid nested-quote issues with spaces in path
> "%TEMP%\start_backend.bat" (
    echo @echo off
    echo cd /d "%PROJECT_ROOT%\backend"
    echo call ".venv\Scripts\activate.bat"
    echo uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
    echo pause
)

start "Backend - uvicorn" cmd /k "%TEMP%\start_backend.bat"

echo [INFO] Starting Frontend Dev Server...

> "%TEMP%\start_frontend.bat" (
    echo @echo off
    echo cd /d "%PROJECT_ROOT%\app"
    echo npm run dev
    echo pause
)

start "Frontend - vite" cmd /k "%TEMP%\start_frontend.bat"

:: Wait a moment then open browser
echo.
echo [INFO] Waiting for servers to start...
timeout /t 4 /nobreak >nul

echo [INFO] Opening browser at http://localhost:5173
start "" "http://localhost:5173"

echo.
echo ============================================
echo   Both servers are running!
echo ============================================
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo.
echo   Close the server windows to stop.
echo ============================================
echo.

endlocal
