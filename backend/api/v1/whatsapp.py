from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
from core.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

NODE_BRIDGE_URL = "http://localhost:3001"

@router.get("/status")
def get_whatsapp_status():
    try:
        res = requests.get(f"{NODE_BRIDGE_URL}/status", timeout=5)
        return res.json()
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

@router.get("/qr")
def get_whatsapp_qr():
    try:
        res = requests.get(f"{NODE_BRIDGE_URL}/qr", timeout=5)
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not connect to WhatsApp bridge")

class WhatsAppConfig(BaseModel):
    target_number: str

@router.post("/config")
def save_whatsapp_config(config: WhatsAppConfig):
    # Update runtime settings
    settings.whatsapp_target_number = config.target_number
    
    # Save to .env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    
    env_lines = []
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            env_lines = f.readlines()
            
    # Remove existing whatsapp lines
    env_lines = [line for line in env_lines if not line.startswith("WHATSAPP_TARGET_NUMBER")]
    
    # Add new lines
    if not env_lines or not env_lines[-1].endswith("\n"):
        env_lines.append("\n")
    env_lines.append(f"WHATSAPP_TARGET_NUMBER={config.target_number}\n")
    
    with open(env_path, "w") as f:
        f.writelines(env_lines)
        
    return {"status": "success", "message": "WhatsApp configuration saved"}

@router.post("/test")
def test_whatsapp_message():
    if not settings.whatsapp_target_number:
        raise HTTPException(status_code=400, detail="Target number not configured")
        
    try:
        msg = "✅ *CreatorOS*\n\nWhatsApp connected successfully! Your reminders will appear here."
        res = requests.post(
            f"{NODE_BRIDGE_URL}/send",
            json={"number": settings.whatsapp_target_number, "message": msg},
            timeout=10
        )
        if res.ok:
            return {"status": "success", "message": "Test notification sent"}
        else:
            err_detail = "Bridge rejected the message"
            try:
                err_detail = res.json().get("error", err_detail)
            except:
                pass
            raise HTTPException(status_code=500, detail=err_detail)
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail="Could not reach WhatsApp bridge. Is it running?")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
