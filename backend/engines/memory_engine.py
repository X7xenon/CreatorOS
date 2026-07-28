from providers.ai.gemini import GeminiProvider

class MemoryEngine:
    def __init__(self, provider: GeminiProvider = None):
        self.provider = provider or GeminiProvider()
        
    def process(self, *args, **kwargs):
        pass
