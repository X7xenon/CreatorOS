from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
from core.database import get_db
from models.trusted_device import TrustedDevice

router = APIRouter()

class DeviceRegistration(BaseModel):
    tailscale_ip: str
    name: str
    platform: str
    browser: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None

@router.post("/register")
def register_device(device: DeviceRegistration, db: Session = Depends(get_db)):
    db_device = db.query(TrustedDevice).filter(TrustedDevice.tailscale_ip == device.tailscale_ip).first()
    if db_device:
        db_device.name = device.name
        db_device.platform = device.platform
        db_device.browser = device.browser
        db_device.screen_width = device.screen_width
        db_device.screen_height = device.screen_height
        db_device.last_seen = datetime.utcnow()
    else:
        db_device = TrustedDevice(
            id=device.tailscale_ip,
            tailscale_ip=device.tailscale_ip,
            name=device.name,
            platform=device.platform,
            browser=device.browser,
            screen_width=device.screen_width,
            screen_height=device.screen_height
        )
        db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return {"status": "registered", "device": device.dict()}

@router.get("/")
def list_devices(db: Session = Depends(get_db)):
    devices = db.query(TrustedDevice).all()
    return [{"id": d.id, "ip": d.tailscale_ip, "name": d.name, "platform": d.platform, "trusted": d.trusted, "last_seen": d.last_seen.isoformat() if d.last_seen else None} for d in devices]

@router.put("/{ip}/trust")
def set_trust(ip: str, trusted: bool, db: Session = Depends(get_db)):
    device = db.query(TrustedDevice).filter(TrustedDevice.tailscale_ip == ip).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    device.trusted = trusted
    db.commit()
    return {"status": "updated", "ip": ip, "trusted": trusted}

@router.delete("/{ip}")
def remove_device(ip: str, db: Session = Depends(get_db)):
    device = db.query(TrustedDevice).filter(TrustedDevice.tailscale_ip == ip).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"status": "removed", "ip": ip}
