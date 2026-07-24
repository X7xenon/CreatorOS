from abc import ABC, abstractmethod

class NotificationProvider(ABC):
    @abstractmethod
    def send(self, message: str) -> bool:
        """
        Send a notification. 
        Returns True if successful, False otherwise.
        """
        pass
