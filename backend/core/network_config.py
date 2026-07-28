import json
import os
from pydantic import BaseModel
from typing import Optional

class NetworkConfig(BaseModel):
    frontend_port: int = 7070
    backend_port: int = 8888
    websocket_port: int = 8888
    tailscale_exe: str = "C:\\Program Files\\Tailscale\\tailscale.exe"

_config: Optional[NetworkConfig] = None
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "settings", "network.json")

def get_network_config() -> NetworkConfig:
    global _config
    if _config is None:
        try:
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH, "r") as f:
                    data = json.load(f)
                    _config = NetworkConfig(**data)
            else:
                _config = NetworkConfig()
        except Exception as e:
            print(f"Error loading network config: {e}")
            _config = NetworkConfig()
    return _config

def save_network_config(config: NetworkConfig):
    global _config
    _config = config
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump(config.dict(), f, indent=2)
