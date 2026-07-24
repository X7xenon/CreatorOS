from typing import Dict, Any, Type, TypeVar

T = TypeVar('T')

class Container:
    _instances: Dict[Type, Any] = {}
    
    @classmethod
    def register(cls, interface: Type[T], instance: T) -> None:
        cls._instances[interface] = instance
        
    @classmethod
    def resolve(cls, interface: Type[T]) -> T:
        if interface not in cls._instances:
            raise ValueError(f"Dependency {interface} not found in container")
        return cls._instances[interface]

container = Container()
