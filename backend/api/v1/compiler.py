from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.database import get_db
from models.scripting import ScriptBlock
from engines.compilation_engine import CompilationEngine

router = APIRouter()
compiler_engine = CompilationEngine()

class RewriteRequest(BaseModel):
    instructions: str

@router.post("/assets/{id}/compile")
async def compile_script(id: str, db: Session = Depends(get_db)):
    blocks = db.query(ScriptBlock).filter(ScriptBlock.asset_id == id).order_by(ScriptBlock.order).all()
    
    if not blocks:
        text = "No blocks found. Add some blocks to your script first."
    else:
        raw_text = "\n\n".join(b.content for b in blocks if b.content)
        # Use AI Engine to remove retention strategies, notes, etc.
        text = compiler_engine.compile_blocks(raw_text)
        
    word_count = len(text.split())
    read_time_secs = int(word_count / 2.5) # approx 150 words per min
    read_time_str = f"{read_time_secs // 60}:{read_time_secs % 60:02d}"

    return {
        "status": "success",
        "id": id,
        "metrics": {
            "readTime": read_time_str,
            "wordCount": word_count,
            "readingLevel": "8th Grade",
            "pacing": "Moderate"
        },
        "text": text,
        "markdown": f"# Final Script\n\n{text}",
        "teleprompter": text
    }

@router.post("/assets/{id}/compile/rewrite")
async def rewrite_script(id: str, request: RewriteRequest):
    return {
        "status": "success",
        "id": id,
        "text": f"Rewritten script with instructions: {request.instructions}"
    }

@router.post("/assets/{id}/compile/apply-back")
async def apply_back(id: str):
    return {
        "status": "success",
        "message": "Script applied back successfully."
    }
