import json
import logging
from core.ws_manager import manager

class NotificationDispatcher:
    def __init__(self):
        self.logger = logging.getLogger("NotificationDispatcher")
        
    async def push(self, event: str, payload: dict, target: str = "all"):
        """
        Push a notification to clients.
        event: e.g., 'compile_finished', 'export_done', 'gemini_done', 'system_alert'
        target: tailscale IP or "all"
        """
        message = {
            "type": "notification",
            "event": event,
            "payload": payload
        }
        
        if target == "all":
            await manager.broadcast_json(message)
        else:
            connections = manager.active_connections.get(target, [])
            for conn in connections:
                try:
                    await conn.send_text(json.dumps(message))
                except Exception as e:
                    self.logger.error(f"Failed to send to {target}: {e}")

dispatcher = NotificationDispatcher()
