import json
import subprocess
import asyncio
import logging
from fastapi import APIRouter
from core.network_config import get_network_config
from core.ws_manager import manager
from core.notifications.dispatcher import dispatcher

router = APIRouter()
logger = logging.getLogger("TailscaleAPI")

_last_status = None

def get_tailscale_status():
    config = get_network_config()
    exe_path = config.tailscale_exe
    try:
        result = subprocess.run([exe_path, "status", "--json"], capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        
        # Parse relevant fields
        tailscale_ip = data.get("Self", {}).get("TailscaleIPs", [""])[0]
        device_name = data.get("Self", {}).get("HostName", "")
        online = data.get("Self", {}).get("Online", False)
        
        peers = []
        for peer_id, peer_data in data.get("Peer", {}).items():
            peers.append({
                "name": peer_data.get("HostName", ""),
                "ip": peer_data.get("TailscaleIPs", [""])[0],
                "online": peer_data.get("Online", False),
                "last_seen": peer_data.get("LastSeen", ""),
                "os": peer_data.get("OS", "")
            })
            
        backend_url = f"http://{tailscale_ip}:{config.backend_port}" if tailscale_ip else ""
        frontend_url = f"http://{tailscale_ip}:{config.frontend_port}" if tailscale_ip else ""
        
        return {
            "connected": online,
            "tailscale_ip": tailscale_ip,
            "device_name": device_name,
            "backend_url": backend_url,
            "frontend_url": frontend_url,
            "peers": peers
        }
    except Exception as e:
        logger.error(f"Failed to get tailscale status: {e}")
        return {
            "connected": False,
            "tailscale_ip": "",
            "device_name": "",
            "backend_url": "",
            "frontend_url": "",
            "peers": [],
            "error": str(e)
        }

@router.get("/status")
def tailscale_status():
    return get_tailscale_status()

async def poll_tailscale_status():
    global _last_status
    while True:
        try:
            status = get_tailscale_status()
            # Compare json string to detect changes
            status_str = json.dumps(status)
            last_status_str = json.dumps(_last_status) if _last_status else ""
            
            if status_str != last_status_str:
                _last_status = status
                await manager.broadcast_json({
                    "type": "tailscale_status",
                    "payload": status
                })
        except Exception as e:
            logger.error(f"Tailscale poller error: {e}")
            
        await asyncio.sleep(3)

def start_tailscale_poller():
    asyncio.create_task(poll_tailscale_status())
