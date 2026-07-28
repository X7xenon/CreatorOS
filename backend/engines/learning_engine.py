from providers.ai.gemini import GeminiProvider

class LearningEngine:
    def __init__(self, provider: GeminiProvider = None):
        self.provider = provider or GeminiProvider()
        
    def process(self, *args, **kwargs):
        pass
