import asyncio
import json
from typing import Dict, List, Any
from fastapi import WebSocket
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        # Maps tailscale IP -> list of websockets (in case multiple tabs)
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        # All websockets for broadcast
        self.all_sockets: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, ip: str = "unknown"):
        await websocket.accept()
        self.active_connections[ip].append(websocket)
        self.all_sockets.append(websocket)

    def disconnect(self, websocket: WebSocket, ip: str = "unknown"):
        if websocket in self.all_sockets:
            self.all_sockets.remove(websocket)
        if ip in self.active_connections and websocket in self.active_connections[ip]:
            self.active_connections[ip].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception:
            pass

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.all_sockets:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
                
        for d in disconnected:
            self.disconnect(d)

    async def broadcast_json(self, data: dict):
        await self.broadcast(json.dumps(data))

# Global manager for tailscale/system WS
manager = ConnectionManager()
