import subprocess
import shutil
import asyncio
from fastapi import APIRouter
from core.database import get_db, engine
from sqlalchemy import text
from core.ws_manager import manager
import httpx

router = APIRouter()

async def get_system_health():
    health = {
        "backend": "offline",
        "frontend": "offline",
        "database": "offline",
        "websocket": "offline",
        "tailscale": "offline",
        "gemini": "warning", # assume warning if uncheckable
        "storage": "offline",
        "memory": "warning",
        "knowledge": "warning",
        "compilation": "warning"
    }

    # Backend is inherently online if this code runs
    health["backend"] = "healthy"
    
    # Websocket is online if manager has sockets or is running
    health["websocket"] = "healthy"
    
    # Frontend check
    from core.network_config import get_network_config
    config = get_network_config()
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"http://localhost:{config.frontend_port}")
            if res.status_code == 200:
                health["frontend"] = "healthy"
            else:
                health["frontend"] = "warning"
    except Exception:
        health["frontend"] = "offline"

    # DB check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            health["database"] = "healthy"
    except Exception:
        pass

    # Tailscale check
    try:
        result = subprocess.run([config.tailscale_exe, "status"], capture_output=True)
        if result.returncode == 0:
            health["tailscale"] = "healthy"
        else:
            health["tailscale"] = "offline"
    except Exception:
        pass

    # Storage check
    try:
        total, used, free = shutil.disk_usage("/")
        if free / total < 0.05: # less than 5% free
            health["storage"] = "warning"
        else:
            health["storage"] = "healthy"
    except Exception:
        pass

    return health

@router.get("/health")
async def check_health():
    return await get_system_health()

async def poll_system_health():
    while True:
        try:
            health = await get_system_health()
            await manager.broadcast_json({
                "type": "health_update",
                "payload": health
            })
        except Exception:
            pass
        await asyncio.sleep(10)

def start_health_poller():
    asyncio.create_task(poll_system_health())
