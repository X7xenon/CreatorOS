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
from api.v1.scripting import router as scripting_router
from core.database import engine, Base
from core.scheduler import start_scheduler, stop_scheduler
from api.v1.tailscale import start_tailscale_poller
from api.v1.system_health import start_health_poller
from api.v1.remote_control import start_stats_poller

import models.account
import models.scripting
import models.compiled_asset
import models.profiles
import models.prompt_history
import models.inbox
import models.trusted_device
import models.sync_queue

# Create database tables
Base.metadata.create_all(bind=engine)

from sqlalchemy import text

# Quick Auto-Migration
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE content_assets ADD COLUMN director_data JSON;"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE content_assets ADD COLUMN profile_id INTEGER REFERENCES creator_profiles(id);"))
        conn.commit()
except Exception:
    pass

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    start_tailscale_poller()
    start_health_poller()
    start_stats_poller()
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
app.include_router(scripting_router)
from api.v1.compiler import router as compiler_router
app.include_router(compiler_router, prefix="/api/v1", tags=["compiler"])
from api.v1.mission import router as mission_router
from api.v1.proxy import router as proxy_router
from api.v1.profiles import router as profiles_router
from api.v1.tailscale import router as tailscale_router
from api.v1.system_health import router as health_router
from api.v1.remote_control import router as remote_router
from api.v1.network_settings import router as network_router
from api.v1.inbox import router as inbox_router
from api.v1.devices import router as devices_router
from api.v1.sync import router as sync_router

app.include_router(mission_router, prefix="/api/v1/mission", tags=["mission"])
app.include_router(proxy_router, prefix="/api/v1/proxy", tags=["proxy"])
app.include_router(profiles_router, prefix="/api/v1/profiles", tags=["profiles"])
app.include_router(tailscale_router, prefix="/api/v1/tailscale", tags=["tailscale"])
app.include_router(health_router, prefix="/api/v1/system", tags=["health"])
app.include_router(remote_router, prefix="/api/v1/remote", tags=["remote"])
app.include_router(network_router, prefix="/api/v1/network", tags=["network"])
app.include_router(inbox_router, prefix="/api/v1/inbox", tags=["inbox"])
app.include_router(devices_router, prefix="/api/v1/devices", tags=["devices"])
app.include_router(sync_router, prefix="/api/v1/sync", tags=["sync"])

