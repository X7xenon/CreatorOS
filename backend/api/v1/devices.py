from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DeviceRegistration(BaseModel):
    tailscale_ip: str
    name: str
    platform: str
    browser: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None

@router.post("/register")
def register_device(device: DeviceRegistration):
    # In a real app we'd save this to DB TrustedDevice
    return {"status": "registered", "device": device.dict()}

@router.get("/")
def list_devices():
    # Return mock or db devices
    return []

@router.put("/{ip}/trust")
def set_trust(ip: str, trusted: bool):
    return {"status": "updated", "ip": ip, "trusted": trusted}

@router.delete("/{ip}")
def remove_device(ip: str):
    return {"status": "removed", "ip": ip}
