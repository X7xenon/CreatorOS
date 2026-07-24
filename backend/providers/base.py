from abc import ABC, abstractmethod
from typing import Dict, Any, List

class PlatformProvider(ABC):
    @abstractmethod
    def login(self, username: str, password: str) -> str:
        """
        Authenticate with the platform and return the serialized session string.
        """
        pass

    @abstractmethod
    def fetch_profile(self, session_data: str) -> Dict[str, Any]:
        """
        Fetch profile stats (followers, following, etc.)
        """
        pass

    @abstractmethod
    def fetch_recent_media(self, session_data: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Fetch recent media (posts/reels) and their stats.
        """
        pass
