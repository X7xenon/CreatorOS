from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class AIProvider(ABC):
    """Abstract base class for all AI Providers"""
    
    @abstractmethod
    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, model: Optional[str] = None, temperature: float = 0.7) -> str:
        """Generate text from a prompt"""
        pass
        
    @abstractmethod
    def analyze_json(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON output"""
        pass
        
    @abstractmethod
    def generate_embeddings(self, text: str) -> List[float]:
        """Generate vector embeddings for semantic search"""
        pass
