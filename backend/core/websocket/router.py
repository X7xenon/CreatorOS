from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from core.event_bus import event_bus
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# Subscriber for event bus
async def handle_live_activity(event_data):
    await manager.broadcast(json.dumps({"event": "LiveActivity", "data": event_data}))

event_bus.subscribe("live_activity", handle_live_activity)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/tailscale")
async def websocket_tailscale(websocket: WebSocket):
    # Determine IP from headers or client host, fallback to 'unknown'
    client_ip = "unknown"
    if websocket.client:
        client_ip = websocket.client.host
    
    await manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming commands if any
            data = await websocket.receive_text()
            # For now, we only push data to the client, but we can handle commands here later
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
