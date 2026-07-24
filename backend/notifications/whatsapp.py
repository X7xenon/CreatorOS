import requests
import logging
from .base import NotificationProvider
from core.config import settings

logger = logging.getLogger(__name__)
NODE_BRIDGE_URL = "http://localhost:3001"

class WhatsAppNotificationProvider(NotificationProvider):
    def __init__(self):
        self.target_number = settings.whatsapp_target_number
        
    def send(self, message: str) -> bool:
        if not self.target_number:
            logger.error("WhatsApp target number is missing in configuration.")
            return False
            
        try:
            response = requests.post(
                f"{NODE_BRIDGE_URL}/send",
                json={"number": self.target_number, "message": message},
                timeout=10
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return False
