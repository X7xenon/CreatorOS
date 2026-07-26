import os
import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from .base import AIProvider

class GeminiProvider(AIProvider):
    def __init__(self):
        # Always use environment variable as recommended by user, not database
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.is_configured = True
        else:
            self.is_configured = False
            
    def _get_model_name(self, requested_model: Optional[str]) -> str:
        # Fallback to flash if not specified
        if requested_model == "Gemini 2.5 Pro":
            return "gemini-2.5-pro"
        elif requested_model == "Gemini Flash Lite":
            return "gemini-2.5-flash-lite"
        return "gemini-2.5-flash"
        
    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, model: Optional[str] = None, temperature: float = 0.7) -> str:
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured in .env")
            
        model_name = self._get_model_name(model)
        
        # Configure model parameters
        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
        )
        
        if system_prompt:
            model_instance = genai.GenerativeModel(model_name, system_instruction=system_prompt)
        else:
            model_instance = genai.GenerativeModel(model_name)
            
        response = model_instance.generate_content(prompt, generation_config=generation_config)
        return response.text
        
    def analyze_json(self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, model: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured in .env")
            
        model_name = self._get_model_name(model)
        
        # We tell the model to output JSON adhering to the schema
        # In Gemini 1.5, response_mime_type="application/json" forces JSON output
        generation_config = genai.types.GenerationConfig(
            temperature=0.2, # Lower temp for JSON structure
            response_mime_type="application/json",
            # We can optionally pass response_schema if using strictly structured outputs
            # response_schema=schema
        )
        
        full_prompt = f"Analyze the following request and return a JSON object adhering to this schema: {json.dumps(schema)}\n\nRequest:\n{prompt}"
        
        if system_prompt:
            model_instance = genai.GenerativeModel(model_name, system_instruction=system_prompt)
        else:
            model_instance = genai.GenerativeModel(model_name)
            
        response = model_instance.generate_content(full_prompt, generation_config=generation_config)
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse Gemini response as JSON: {response.text}")
            
    def generate_embeddings(self, text: str) -> List[float]:
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured in .env")
            
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text
        )
        return result['embedding']
