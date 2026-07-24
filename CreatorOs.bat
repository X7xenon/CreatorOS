@echo off
cd /d "%~dp0"
echo ==========================================
echo Starting CreatorOS Services...
echo ==========================================

:: 1. Start WhatsApp Node Bridge in background
echo [1/3] Starting WhatsApp Bridge (Port 3001)...
cd backend\plugins\whatsapp-bridge
start "WhatsApp Bridge" /B node index.js
cd ..\..\..

:: 2. Start Python FastAPI Backend in background
echo [2/3] Starting FastAPI Backend (Port 8888)...
cd backend
start "FastAPI Backend" /B .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8888 --reload
cd ..

:: 3. Start React Frontend
echo [3/3] Starting React Frontend (Port 7070)...
cd frontend
start "React Frontend" npm run dev -- --port 7070 --strictPort
cd ..

echo ==========================================
echo All services have been launched!
echo ==========================================
pause
