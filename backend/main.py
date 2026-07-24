from fastapi import FastAPI
import os
import subprocess
import threading
import time
from fastapi.middleware.cors import CORSMiddleware
from api.v1.dashboard import router as dashboard_router
from core.websocket.router import router as websocket_router
from api.v1.comparison import router as comparison_router
from api.v1.auth import router as auth_router
from core.database import engine, Base
from core.scheduler import start_scheduler, stop_scheduler

# Create database tables
Base.metadata.create_all(bind=engine)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(
    title="CreatorOS Analytics API",
    description="Backend API for CreatorOS Analytics Dashboard",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/v1/system/shutdown")
def shutdown_system():
    def kill_port(port):
        try:
            # Find PID listening on port
            output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode()
            lines = output.strip().split('\n')
            for line in lines:
                if 'LISTENING' in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    subprocess.Popen(f'taskkill /F /PID {pid} /T', shell=True)
        except Exception as e:
            pass
            
    # Kill frontend and whatsapp
    kill_port(7070)
    kill_port(3001)
    
    # We delay killing the backend slightly so the response can be sent
    def kill_self():
        import time
        time.sleep(1)
        kill_port(8888)
        
        # Fallback to title kill just in case
        os.system('taskkill /FI "WINDOWTITLE eq WhatsApp Bridge*" /T /F')
        os.system('taskkill /FI "WINDOWTITLE eq React Frontend*" /T /F')
        os.system('taskkill /FI "WINDOWTITLE eq FastAPI Backend*" /T /F')
        
        os._exit(0)
    
    threading.Thread(target=kill_self).start()
    return {"status": "shutting down"}

from api.v1.calendar import router as calendar_router
from api.v1.whatsapp import router as whatsapp_router

app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(websocket_router, prefix="/api/v1/ws", tags=["websocket"])
app.include_router(comparison_router, prefix="/api/v1/comparison", tags=["comparison"])
app.include_router(calendar_router, prefix="/api/v1/calendar", tags=["calendar"])
app.include_router(whatsapp_router, prefix="/api/v1/whatsapp", tags=["whatsapp"])
from api.v1.mission import router as mission_router
from api.v1.proxy import router as proxy_router
app.include_router(mission_router, prefix="/api/v1/mission", tags=["mission"])
app.include_router(proxy_router, prefix="/api/v1/proxy", tags=["proxy"])

