import re
from typing import Dict, Any, List

class LocalAnalysisEngine:
    """Pre-flight regex, keyword extraction, and similarity search before hitting AI"""
    
    STOP_WORDS = {"the", "is", "at", "which", "on", "in", "and", "a", "to", "for", "of", "with", "as", "by"}
    
    @staticmethod
    def extract_keywords(text: str) -> List[str]:
        if not text:
            return []
        
        # Simple local keyword extraction
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        keywords = [w for w in words if w not in LocalAnalysisEngine.STOP_WORDS]
        
        # Count frequency and get top 5
        freq = {}
        for w in keywords:
            freq[w] = freq.get(w, 0) + 1
            
        sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [w[0] for w in sorted_words[:5]]

    @staticmethod
    def identify_audience(text: str) -> str:
        text_lower = text.lower()
        if any(w in text_lower for w in ["beginner", "start", "newbie", "basic"]):
            return "Beginners"
        if any(w in text_lower for w in ["expert", "advanced", "pro"]):
            return "Professionals"
        if any(w in text_lower for w in ["student", "school", "college"]):
            return "Students"
        return "Broad Audience"
        
    @staticmethod
    def analyze_idea(idea_text: str) -> Dict[str, Any]:
        """Perform 100% local analysis to save tokens"""
        keywords = LocalAnalysisEngine.extract_keywords(idea_text)
        audience = LocalAnalysisEngine.identify_audience(idea_text)
        
        # Estimate complexity based on sentence length and rare words
        words = idea_text.split()
        avg_word_length = sum(len(w) for w in words) / max(len(words), 1)
        complexity = "High" if avg_word_length > 6 else ("Medium" if avg_word_length > 4.5 else "Low")
        
        return {
            "keywords": keywords,
            "audience_guess": audience,
            "complexity_guess": complexity,
            "word_count": len(words)
        }
