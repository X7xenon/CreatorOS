import os
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List

router = APIRouter()

INBOX_DIR = "inbox"
os.makedirs(INBOX_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    device_name: str = Form("Unknown"),
    notes: str = Form("")
):
    try:
        file_id = str(uuid.uuid4())
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        filename = f"{file_id}{ext}"
        filepath = os.path.join(INBOX_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        size = len(content)
        
        # In a real app we'd save to InboxItem db table here
        
        return {
            "status": "success",
            "id": file_id,
            "filename": file.filename,
            "size": size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/items")
def list_items():
    # Return mock or db items
    return []

@router.delete("/items/{item_id}")
def delete_item(item_id: str):
    # Delete from db and file system
    return {"status": "deleted"}
