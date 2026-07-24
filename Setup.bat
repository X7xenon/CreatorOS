@echo off
setlocal
cd /d "%~dp0"

echo.
echo  =========================================
echo   CreatorOS - First Time Setup
echo  =========================================
echo.

:: ──────────────────────────────────────
:: 1. Python Backend - Create venv
:: ──────────────────────────────────────
echo [1/4] Setting up Python virtual environment...
cd backend

if not exist "venv" (
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Python not found. Please install Python 3.11+ and try again.
        echo         Download: https://www.python.org/downloads/
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created.
) else (
    echo [SKIP] venv already exists.
)

echo [2/4] Installing Python dependencies...
call venv\Scripts\pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install Python packages. Check your internet connection.
    pause
    exit /b 1
)
echo [OK] Python packages installed.
cd ..

:: ──────────────────────────────────────
:: 2. Node - WhatsApp Bridge
:: ──────────────────────────────────────
echo [3/4] Installing Node.js dependencies for WhatsApp Bridge...
cd backend\plugins\whatsapp-bridge
if not exist "node_modules" (
    call npm install --silent
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please make sure Node.js is installed.
        echo         Download: https://nodejs.org/
        pause
        exit /b 1
    )
    echo [OK] WhatsApp Bridge packages installed.
) else (
    echo [SKIP] node_modules already exists.
)
cd ..\..\..

:: ──────────────────────────────────────
:: 3. Node - React Frontend
:: ──────────────────────────────────────
echo [4/4] Installing Node.js dependencies for React frontend...
cd frontend
if not exist "node_modules" (
    call npm install --silent
    if errorlevel 1 (
        echo [ERROR] npm install failed for frontend.
        pause
        exit /b 1
    )
    echo [OK] Frontend packages installed.
) else (
    echo [SKIP] node_modules already exists.
)
cd ..

echo.
echo  =========================================
echo   Setup Complete! 
echo   Run 'CreatorOs.bat' to start CreatorOS.
echo  =========================================
echo.
pause
