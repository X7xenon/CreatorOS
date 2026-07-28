from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.network_config import get_network_config, save_network_config, NetworkConfig

router = APIRouter()

class PathUpdate(BaseModel):
    tailscale_exe: str

@router.get("/config")
def get_config():
    config = get_network_config()
    return config.dict()

@router.put("/config")
def update_config(config: NetworkConfig):
    save_network_config(config)
    return {"status": "updated", "config": config.dict()}

@router.put("/tailscale-path")
def update_tailscale_path(payload: PathUpdate):
    config = get_network_config()
    config.tailscale_exe = payload.tailscale_exe
    save_network_config(config)
    return {"status": "updated", "tailscale_exe": config.tailscale_exe}
