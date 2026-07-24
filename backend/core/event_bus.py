from typing import Callable, Dict, List, Any
import asyncio

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_name: str, callback: Callable) -> None:
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        self._subscribers[event_name].append(callback)

    async def publish(self, event_name: str, *args: Any, **kwargs: Any) -> None:
        if event_name in self._subscribers:
            for callback in self._subscribers[event_name]:
                if asyncio.iscoroutinefunction(callback):
                    await callback(*args, **kwargs)
                else:
                    callback(*args, **kwargs)

event_bus = EventBus()
