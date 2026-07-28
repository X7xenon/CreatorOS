import os
import subprocess
import threading
import shutil
import asyncio
from fastapi import APIRouter, BackgroundTasks
from core.ws_manager import manager
import datetime
from core.database import engine

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

router = APIRouter()

def get_stats():
    cpu = 0
    ram = 0
    disk = 0
    queue_depth = 0
    if PSUTIL_AVAILABLE:
        cpu = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory().percent
        try:
            disk = psutil.disk_usage(os.path.abspath(os.sep)).percent
        except:
            pass
    
    if disk == 0:
        try:
            total, used, free = shutil.disk_usage(os.path.abspath(os.sep))
            disk = (used / total) * 100
        except:
            pass
        
    return {
        "cpu": cpu,
        "ram": ram,
        "disk": disk,
        "queue_depth": queue_depth
    }

@router.get("/system-stats")
def system_stats():
    return get_stats()

async def poll_system_stats():
    while True:
        try:
            stats = get_stats()
            await manager.broadcast_json({
                "type": "system_stats",
                "payload": stats
            })
        except Exception:
            pass
        await asyncio.sleep(5)

def start_stats_poller():
    asyncio.create_task(poll_system_stats())

@router.post("/restart-backend")
def restart_backend():
    # Placeholder for restart logic
    return {"status": "success", "message": "Backend restart signal sent"}

@router.post("/restart-frontend")
def restart_frontend():
    # Placeholder for frontend restart logic
    return {"status": "success", "message": "Frontend restart signal sent"}

@router.post("/clear-cache")
def clear_cache():
    return {"status": "success", "message": "Cache cleared"}

@router.post("/backup-db")
def backup_db():
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    db_path = "creatoros.db"
    backup_path = f"creatoros_backup_{timestamp}.db"
    if os.path.exists(db_path):
        shutil.copy2(db_path, backup_path)
        return {"status": "success", "message": f"Database backed up to {backup_path}"}
    return {"status": "error", "message": "Database file not found"}

@router.post("/sync-memory")
def sync_memory():
    return {"status": "success", "message": "Memory sync triggered"}

@router.post("/shutdown")
def shutdown_system():
    def kill_port(port):
        try:
            output = subprocess.check_output(f'netstat -ano | findstr :{port}', shell=True).decode()
            lines = output.strip().split('\n')
            for line in lines:
                if 'LISTENING' in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    subprocess.Popen(f'taskkill /F /PID {pid} /T', shell=True)
        except Exception as e:
            pass
            
    kill_port(7070)
    kill_port(3001)
    
    def kill_self():
        import time
        time.sleep(1)
        kill_port(8888)
        os.system('taskkill /FI "WINDOWTITLE eq WhatsApp Bridge*" /T /F')
        os.system('taskkill /FI "WINDOWTITLE eq React Frontend*" /T /F')
        os.system('taskkill /FI "WINDOWTITLE eq FastAPI Backend*" /T /F')
        os._exit(0)
    
    threading.Thread(target=kill_self).start()
    return {"status": "success", "message": "Shutting down"}

@router.post("/wake-teleprompter")
def wake_teleprompter():
    return {"status": "success", "message": "Teleprompter awake signal sent"}

@router.post("/start-export")
def start_export():
    return {"status": "success", "message": "Export process started"}
