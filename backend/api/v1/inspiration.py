from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json

from models.inspiration import InspirationCard
from core.database import get_db
from providers.ai.gemini import GeminiProvider

ai = GeminiProvider()

router = APIRouter(prefix="/api/v1/inspiration", tags=["inspiration"])

class InspirationCreate(BaseModel):
    title: str
    url: str
    platform: str
    creator: str
    category: str
    tags: List[str] = []
    status: str = "new"

class ActionRequest(BaseModel):
    action_type: str

@router.get("/")
def list_inspirations(db: Session = Depends(get_db)):
    return db.query(InspirationCard).all()

@router.post("/")
def create_inspiration(card: InspirationCreate, db: Session = Depends(get_db)):
    db_card = InspirationCard(
        title=card.title,
        url=card.url,
        platform=card.platform,
        creator=card.creator,
        category=card.category,
        tags=card.tags,
        status=card.status
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@router.post("/{id}/analyze")
def analyze_inspiration(id: int, db: Session = Depends(get_db)):
    card = db.query(InspirationCard).filter(InspirationCard.id == id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured")
        
    prompt = (
        f"Analyze this content piece for a creator: Title: '{card.title}', "
        f"URL: '{card.url}', Platform: '{card.platform}'. "
        "Return a detailed JSON analysis with insights."
    )
    
    schema = {
        "Hook": "string (The psychological hook used)",
        "Camera Style": "string (E.g., fast-paced, talking head, dynamic)",
        "Audience": "string (The exact target demographic)",
        "Key Takeaways": ["string (3 actionable lessons)"]
    }
    
    try:
        analysis_data = ai.analyze_json(prompt=prompt, schema=schema)
        card.analysis_json = analysis_data
        card.status = "analyzed"
        db.commit()
        db.refresh(card)
        return {"message": "Analysis complete", "analysis": analysis_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/action")
def run_action(id: int, request: ActionRequest, db: Session = Depends(get_db)):
    card = db.query(InspirationCard).filter(InspirationCard.id == id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    if request.action_type == "Generate Similar Ideas":
        if not ai.is_configured:
            raise HTTPException(status_code=503, detail="AI not configured")
        prompt = f"Generate 3 similar content ideas based on this successful post: '{card.title}' by {card.creator}."
        ideas_response = ai.generate_text(prompt=prompt)
        return {"action": request.action_type, "result": ideas_response}
    
    return {"message": f"Action '{request.action_type}' executed for card {id}"}
