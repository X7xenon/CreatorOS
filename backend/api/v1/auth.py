from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from core.database import get_db
from models.account import ConnectedAccount
from core.security import encrypt_data
from providers.instagram import InstagrapiProvider
from pydantic import BaseModel
import uuid
from datetime import datetime
from workers.collector import sync_daily_snapshots, sync_recent_media

router = APIRouter()

class InstagramLoginRequest(BaseModel):
    username: str
    password: str = None
    session_id: str = None

@router.post("/instagram/login")
def login_instagram(req: InstagramLoginRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Authenticates with Instagram via Instagrapi.
    Accepts either (username + password) or (username + session_id cookie).
    """
    try:
        provider = InstagrapiProvider()
        
        if req.session_id:
            # Bypass traditional login using browser session cookie
            real_username, session_string = provider.login_with_session(req.session_id)
        else:
            # Traditional login (can trigger verification blocks)
            real_username, session_string = provider.login(req.username, req.password)
        
        encrypted_session = encrypt_data(session_string)
        
        account = db.query(ConnectedAccount).filter(ConnectedAccount.username == real_username).first()
        
        if account:
            account.encrypted_session_data = encrypted_session
        else:
            account = ConnectedAccount(
                id=f"ig_{uuid.uuid4().hex[:8]}",
                platform="Instagram",
                username=real_username,
                type="OWNER",
                encrypted_session_data=encrypted_session
            )
            db.add(account)
            
        db.commit()
        
        # Trigger an initial sync immediately in the background so dashboard populates
        background_tasks.add_task(sync_daily_snapshots)
        background_tasks.add_task(sync_recent_media)
        
        return {"status": "success", "message": "Instagram account connected securely!"}
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Instagram login failed: {str(e)}")

@router.get("/accounts")
def get_accounts(db: Session = Depends(get_db)):
    accounts = db.query(ConnectedAccount).all()
    return [{"id": a.id, "platform": a.platform, "handle": a.username} for a in accounts]

@router.delete("/accounts/{account_id}")
def delete_account(account_id: str, db: Session = Depends(get_db)):
    account = db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"status": "success"}
