from providers.ai.gemini import GeminiProvider

class CompilationEngine:
    def __init__(self, provider: GeminiProvider = None):
        self.provider = provider or GeminiProvider()
        
    def compile_blocks(self, raw_text: str) -> str:
        prompt = f"""
You are a master script compiler.
I will give you a raw script constructed from various blocks. It contains metadata, notes, formatting artifacts (like ### Option 1), and strategies (like **Retention Strategy:**).
Your job is to strip out ALL metadata, notes, and strategies.
Return ONLY the final readable script/dialogue that the creator will actually read into the camera.
Do not change the spoken words, just remove the clutter.
Return pure text, no markdown formatting like bold/italics unless it's for emphasis in the spoken script.

RAW SCRIPT:
{raw_text}
"""
        try:
            # We use the pro model here as instruction following is better
            response = self.provider.generate_text(prompt, model="Gemini Pro")
            return response.strip()
        except Exception as e:
            print(f"Gemini Compilation Failed: {e}")
            # Robust Fallback: Strip markdown artifacts manually using regex
            import re
            cleaned_lines = []
            for line in raw_text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                
                # Skip headings
                if line.startswith('#'):
                    continue
                
                # Skip list items that are just metadata like '* **Retention Strategy:**'
                if (line.startswith('* ') or line.startswith('- ')) and '**' in line and ':' in line:
                    continue
                
                # Skip standalone bold labels like '**Hook:**'
                if line.startswith('**') and line.endswith('**') and len(line) < 30 and ':' in line:
                    continue

                # If it's a quote block (e.g. > "Dialogue"), extract the dialogue
                if line.startswith('>'):
                    line = line[1:].strip()
                
                # Remove wrapping quotes if they exist
                if line.startswith('"') and line.endswith('"'):
                    line = line[1:-1]
                        
                # If the line was just wrapped in bold for emphasis, keep the text but remove the bold markers
                if line.startswith('**') and line.endswith('**'):
                    line = line[2:-2]
                    # Also strip quotes inside if any
                    if line.startswith('"') and line.endswith('"'):
                        line = line[1:-1]

                cleaned_lines.append(line)
                
            return "\n\n".join(cleaned_lines)

