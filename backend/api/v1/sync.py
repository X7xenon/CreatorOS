from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

@router.get("/pending/{device_ip}")
def get_pending_syncs(device_ip: str):
    return []

@router.post("/push")
def push_sync_items(items: List[Dict[str, Any]]):
    # Process incoming offline items
    return {"status": "success", "processed_count": len(items)}

@router.get("/status")
def sync_status():
    return {"status": "idle", "pending_items": 0}
