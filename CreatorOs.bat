@echo off
cd /d "%~dp0"
echo ==========================================
echo Starting CreatorOS Services...
echo ==========================================

:: 1. Start WhatsApp Node Bridge minimized
echo [1/3] Starting WhatsApp Bridge (Port 3001)...
cd backend\plugins\whatsapp-bridge
start "WhatsApp Bridge" /MIN node index.js
cd ..\..\..

:: 2. Start Python FastAPI Backend minimized
echo [2/3] Starting FastAPI Backend (Port 8888)...
cd backend
start "FastAPI Backend" /MIN .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8888 --reload
cd ..

:: 3. Start React Frontend minimized and open browser
echo [3/3] Starting React Frontend (Port 7070)...
cd frontend
start "React Frontend" /MIN npm run dev -- --port 7070 --strictPort --open
cd ..

echo ==========================================
echo All services have been launched in the background!
echo The browser will open shortly. You can safely close this window.
echo ==========================================
timeout /t 5 >nul
exit
