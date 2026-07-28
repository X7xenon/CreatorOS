from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid
import json

from core.database import get_db
from models.scripting import ContentAsset, ScriptBlock, HookTemplate, AssetVersion
from engines.analysis_engine import LocalAnalysisEngine
from providers.ai.gemini import GeminiProvider

router = APIRouter(prefix="/api/v1/scripting", tags=["Scripting Engine"])
ai = GeminiProvider()

CREATOR_SYSTEM_PROMPT = """You are an AI Creative Director and Script Intelligence Engine inside CreatorOS.
You are NOT a generic AI writer. You are a Story Strategist, Retention Analyst, and Script Architect.

Core Rules:
- Be concise. Every word must earn its place.
- Think about RETENTION at every second of the video.
- Score based on evidence, not assumptions.
- Default generation = 3 variants max.
- Always consider the creator's audience first."""

# --- Pydantic Schemas ---
class IdeaRequest(BaseModel):
    text: str

class HookGenerateRequest(BaseModel):
    category: str
    idea_context: str
    model: str = "Gemini 2.5 Flash"
    count: int = 3

class AssetCreate(BaseModel):
    title: str
    type: str = "Script"
    goal: Optional[str] = None
    audience: Optional[str] = None
    language: str = "en"

class AssetUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    goal: Optional[str] = None
    audience: Optional[str] = None
    profile_id: Optional[int] = None

class BlockCreate(BaseModel):
    asset_id: str
    type: str  # Hook, Problem, Story, Proof, CTA, Example
    content: str = ""
    order: int = 0
    parent_id: Optional[str] = None

class BlockUpdate(BaseModel):
    content: Optional[str] = None
    order: Optional[int] = None

class HealthScoreRequest(BaseModel):
    asset_id: str
    model: str = "gemini-3.5-flash"

class BlockImproveRequest(BaseModel):
    action: str
    model: str = "gemini-3.5-flash"

class AIRequestBase(BaseModel):
    model: str = "gemini-3.5-flash"

class ResearchRequest(BaseModel):
    query: str
    model: str = "gemini-3.5-flash"

# --- Idea Analysis ---
@router.post("/analyze")
def analyze_idea(req: IdeaRequest):
    """Local analysis — zero AI tokens used"""
    return LocalAnalysisEngine.analyze_idea(req.text)

# --- Hook Templates ---
@router.get("/hooks/templates")
def get_hook_templates(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Return all hook templates, optionally filtered by category"""
    q = db.query(HookTemplate)
    if category:
        q = q.filter(HookTemplate.category == category)
    return q.all()

@router.get("/hooks/categories")
def get_hook_categories(db: Session = Depends(get_db)):
    """Return list of unique categories"""
    rows = db.query(HookTemplate.category).distinct().all()
    return [r[0] for r in rows]

@router.post("/hooks/generate")
def generate_hooks(req: HookGenerateRequest):
    """AI hook generation — only called when user clicks 'Generate Similar'"""
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured. Add GEMINI_API_KEY to .env")

    prompt = f"""Generate exactly {req.count} high-performing video hooks for the following:
Topic/Idea: "{req.idea_context}"
Hook Style: {req.category}

Rules:
- Each hook must be 1-2 sentences max
- Optimize for 0-3 second retention
- Make them feel PERSONAL and URGENT
- Number each hook (1. 2. 3.)"""

    try:
        response = ai.generate_text(prompt=prompt, system_prompt=CREATOR_SYSTEM_PROMPT, model=req.model, temperature=0.85)
        # Parse into list
        lines = [l.strip() for l in response.split('\n') if l.strip() and l.strip()[0].isdigit()]
        hooks = [l.split('.', 1)[1].strip() if '.' in l else l for l in lines]
        return {"hooks": hooks[:req.count]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Content Assets ---
@router.post("/assets")
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    new_asset = ContentAsset(
        id=str(uuid.uuid4()),
        title=asset.title,
        type=asset.type,
        goal=asset.goal,
        audience=asset.audience,
        language=asset.language
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

@router.get("/assets")
def list_assets(db: Session = Depends(get_db)):
    return db.query(ContentAsset).order_by(ContentAsset.updated_at.desc()).all()

@router.get("/assets/{asset_id}")
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(ContentAsset).filter(ContentAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.patch("/assets/{asset_id}")
def update_asset(asset_id: str, update: AssetUpdate, db: Session = Depends(get_db)):
    asset = db.query(ContentAsset).filter(ContentAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for field, value in update.dict(exclude_none=True).items():
        setattr(asset, field, value)
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(ContentAsset).filter(ContentAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"status": "deleted"}

# --- Script Blocks ---
@router.get("/assets/{asset_id}/blocks")
def get_blocks(asset_id: str, db: Session = Depends(get_db)):
    return db.query(ScriptBlock).filter(ScriptBlock.asset_id == asset_id).order_by(ScriptBlock.order).all()

@router.post("/assets/{asset_id}/blocks")
def create_block(asset_id: str, block: BlockCreate, db: Session = Depends(get_db)):
    new_block = ScriptBlock(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        type=block.type,
        content=block.content,
        order=block.order,
        parent_id=block.parent_id
    )
    db.add(new_block)
    db.commit()
    db.refresh(new_block)
    return new_block

@router.patch("/blocks/{block_id}")
def update_block(block_id: str, update: BlockUpdate, db: Session = Depends(get_db)):
    block = db.query(ScriptBlock).filter(ScriptBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    for field, value in update.dict(exclude_none=True).items():
        setattr(block, field, value)
    db.commit()
    db.refresh(block)
    return block

@router.delete("/blocks/{block_id}")
def delete_block(block_id: str, db: Session = Depends(get_db)):
    block = db.query(ScriptBlock).filter(ScriptBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(block)
    db.commit()
    return {"status": "deleted"}

# --- Auto-save (save version snapshot) ---
@router.post("/assets/{asset_id}/save")
def save_version(asset_id: str, db: Session = Depends(get_db)):
    """Creates a version snapshot of current blocks"""
    asset = db.query(ContentAsset).filter(ContentAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    blocks = db.query(ScriptBlock).filter(ScriptBlock.asset_id == asset_id).order_by(ScriptBlock.order).all()
    
    # Get next version number
    last_v = db.query(AssetVersion).filter(AssetVersion.asset_id == asset_id).order_by(AssetVersion.version_num.desc()).first()
    next_v = (last_v.version_num + 1) if last_v else 1
    
    snapshot = [{"id": b.id, "type": b.type, "content": b.content, "order": b.order} for b in blocks]
    version = AssetVersion(id=str(uuid.uuid4()), asset_id=asset_id, version_num=next_v, content=snapshot)
    db.add(version)
    db.commit()
    return {"version": next_v, "blocks_saved": len(blocks)}

@router.get("/assets/{asset_id}/versions")
def get_versions(asset_id: str, db: Session = Depends(get_db)):
    return db.query(AssetVersion).filter(AssetVersion.asset_id == asset_id).order_by(AssetVersion.version_num.desc()).all()

# --- AI Health Score ---
@router.post("/health-score")
def get_health_score(req: HealthScoreRequest, db: Session = Depends(get_db)):
    """AI-powered script health scoring across 10 dimensions"""
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured. Add GEMINI_API_KEY to .env")
    
    asset = db.query(ContentAsset).filter(ContentAsset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    blocks = db.query(ScriptBlock).filter(ScriptBlock.asset_id == asset.id).order_by(ScriptBlock.order).all()
    
    if not blocks:
        raise HTTPException(status_code=400, detail="No blocks to score. Add content first.")
    
    # Build script text
    script_text = f"Title: {asset.title}\n\n"
    for b in blocks:
        script_text += f"[{b.type.upper()}]\n{b.content}\n\n"
    
    schema = {
        "hook": {"score": "int 0-10", "note": "string"},
        "story": {"score": "int 0-10", "note": "string"},
        "novelty": {"score": "int 0-10", "note": "string"},
        "retention": {"score": "int 0-10", "note": "string"},
        "teaching": {"score": "int 0-10", "note": "string"},
        "emotion": {"score": "int 0-10", "note": "string"},
        "cta": {"score": "int 0-10", "note": "string"},
        "evidence": {"score": "int 0-10", "note": "string"},
        "visual_potential": {"score": "int 0-10", "note": "string"},
        "virality": {"score": "int 0-10", "note": "string"},
        "trust": {"score": "int 0-10", "note": "string"},
        "curiosity": {"score": "int 0-10", "note": "string"},
        "overall": "int 0-10",
        "top_suggestion": "string — the single most impactful improvement"
    }
    
    prompt = f"""Score this video script on all 10 dimensions and return ONLY a JSON object.

Script:
---
{script_text}
---

Be honest and critical. A score of 7+ means it's genuinely strong. Most scripts should score 4-6."""
    
    try:
        result = ai.analyze_json(prompt=prompt, schema=schema, system_prompt=CREATOR_SYSTEM_PROMPT, model=req.model)
        # Also save the overall score to the asset
        if "overall" in result:
            asset.health_score = result["overall"]
            db.commit()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AI Writing Coach ---

@router.post("/blocks/{block_id}/improve")
def improve_block(block_id: str, req: BlockImproveRequest, db: Session = Depends(get_db)):
    """Rewrites a specific block based on an action (e.g. 'Improve Hook', 'Make More Emotional')"""
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured")
        
    block = db.query(ScriptBlock).filter(ScriptBlock.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
        
    prompt = f"Action: {req.action}\n\nRewrite this {block.type} block according to the action. Keep it concise and natural. If the action asks to add something like an example or proof, add it creatively.\n\nCurrent Text:\n{block.content}"
    try:
        new_text = ai.generate_text(prompt=prompt, system_prompt=CREATOR_SYSTEM_PROMPT, model=req.model)
        # We don't save to DB automatically, we return it to the frontend to preview/replace
        return {"original": block.content, "improved": new_text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assets/{asset_id}/director")
def ai_director(asset_id: str, req: AIRequestBase, db: Session = Depends(get_db)):
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured")
        
    asset = db.query(ContentAsset).filter(ContentAsset.id == asset_id).first()
    blocks = db.query(ScriptBlock).filter(ScriptBlock.asset_id == asset_id).order_by(ScriptBlock.order).all()
    script_text = "\n\n".join([f"[{b.type}]\n{b.content}" for b in blocks])
    
    schema = {
        "style": "string (e.g., Fast-paced Shorts, Cinematic Documentary)",
        "camera": ["string (e.g., Talking Head, Handheld)"],
        "b_roll": ["string (e.g., Laptop, Coding, Stock Footage)"],
        "zoom": "string (e.g., Punch Zoom, Dynamic Zoom)",
        "captions": "string (e.g., Karaoke, Minimal)",
        "transitions": ["string (e.g., Hard Cut, Whip Pan)"],
        "sfx": ["string (e.g., Whoosh, Pop)"],
        "music": "string (e.g., Motivational, Cinematic)",
        "vfx": ["string (e.g., Motion Blur, Glow)"],
        "emojis": ["string (emojis only)"]
    }
    
    prompt = f"Act as an AI Video Director. Analyze this script and recommend the best visual and audio editing style.\n\nScript:\n{script_text}"
    try:
        director_data = ai.analyze_json(prompt=prompt, schema=schema, system_prompt=CREATOR_SYSTEM_PROMPT, model=req.model)
        if asset:
            asset.director_data = director_data
            db.commit()
        return director_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assets/{asset_id}/coach-suggestions")
def coach_suggestions(asset_id: str, req: AIRequestBase, db: Session = Depends(get_db)):
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured")
        
    blocks = db.query(ScriptBlock).filter(ScriptBlock.asset_id == asset_id).order_by(ScriptBlock.order).all()
    script_text = "\n\n".join([f"[{b.type}]\n{b.content}" for b in blocks])
    
    schema = {
        "suggestions": ["string (actionable advice, e.g. 'Add a curiosity gap after the hook', 'The CTA is weak')"]
    }
    
    prompt = f"Act as a Writing Coach. Analyze this script and provide 3-5 specific, contextual suggestions to improve retention and engagement. Do not provide generic advice. Be very specific to the script text.\n\nScript:\n{script_text}"
    try:
        res = ai.analyze_json(prompt=prompt, schema=schema, system_prompt=CREATOR_SYSTEM_PROMPT, model=req.model)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assets/{asset_id}/audience-questions")
def audience_questions(asset_id: str, req: AIRequestBase, db: Session = Depends(get_db)):
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured")
        
    blocks = db.query(ScriptBlock).filter(ScriptBlock.asset_id == asset_id).order_by(ScriptBlock.order).all()
    script_text = "\n\n".join([b.content for b in blocks])
    
    schema = {
        "questions": ["string (e.g., 'Is this actually true?', 'How much does it cost?')"]
    }
    
    prompt = f"Analyze this script and predict 3-5 questions or objections the audience will have while watching. This helps the creator answer them before publishing.\n\nScript:\n{script_text}"
    try:
        return ai.analyze_json(prompt=prompt, schema=schema, system_prompt=CREATOR_SYSTEM_PROMPT, model=req.model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/research")
def research_assistant(req: ResearchRequest):
    if not ai.is_configured:
        raise HTTPException(status_code=503, detail="AI not configured")
        
    prompt = f"As a Research Assistant, {req.query}. Provide a concise, highly relevant response that a creator can directly insert into their script as proof, statistics, or examples."
    try:
        text = ai.generate_text(prompt=prompt, system_prompt=CREATOR_SYSTEM_PROMPT, model=req.model)
        return {"result": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
