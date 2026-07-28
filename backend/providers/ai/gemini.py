import os
import json
from google import genai
from google.genai import types
from typing import List, Dict, Any, Optional
from .base import AIProvider

from core.config import settings

class GeminiProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.gemini_api_key
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
            self.is_configured = True
        else:
            self.client = None
            self.is_configured = False
            
    def _get_model_name(self, requested_model: Optional[str]) -> str:
        # Fallback to flash if not specified
        if requested_model and "Pro" in requested_model:
            return "gemini-3.5-pro"
        elif requested_model == "Gemini Flash Lite":
            return "gemini-3.5-flash-8b"
        return "gemini-3.5-flash"
        
    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, model: Optional[str] = None, temperature: float = 0.7) -> str:
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured in .env")
            
        model_name = self._get_model_name(model)
        
        # Configure model parameters
        config_kwargs = {"temperature": temperature}
        if system_prompt:
            config_kwargs["system_instruction"] = system_prompt
            
        config = types.GenerateContentConfig(**config_kwargs)
        
        response = self.client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config
        )
        return response.text
        
    def analyze_json(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured in .env")
            
        model_name = self._get_model_name(model)
        
        config_kwargs = {
            "temperature": 0.2, # Lower temp for JSON structure
            "response_mime_type": "application/json"
        }
        if system_prompt:
            config_kwargs["system_instruction"] = system_prompt
            
        config = types.GenerateContentConfig(**config_kwargs)
        
        full_prompt = f"Analyze the following request and return a JSON object adhering to this schema: {json.dumps(schema)}\n\nRequest:\n{prompt}"
        
        response = self.client.models.generate_content(
            model=model_name,
            contents=full_prompt,
            config=config
        )
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Gemini response as JSON: {response.text}")
            
    def generate_embeddings(self, text: str) -> List[float]:
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured in .env")
            
        response = self.client.models.embed_content(
            model="text-embedding-004",
            contents=text
        )
        return response.embeddings[0].values
