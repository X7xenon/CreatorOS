from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.account import ConnectedAccount, DailySnapshot, Media

router = APIRouter()

class ContentItem(BaseModel):
    title: str
    views: int

class AccountMetrics(BaseModel):
    views: float = 0.0
    subs: float = 0.0

class AccountComparisonData(BaseModel):
    username: str
    platform: str
    metrics: AccountMetrics
    top_content: List[ContentItem]

class ComparisonResponse(BaseModel):
    comparisons: Dict[str, AccountComparisonData]

@router.get("/", response_model=ComparisonResponse)
def compare_accounts(
    usernames: List[str] = Query(..., description="List of usernames to compare"),
    db: Session = Depends(get_db)
):
    if len(usernames) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two usernames to compare")
        
    accounts = db.query(ConnectedAccount).filter(ConnectedAccount.username.in_(usernames)).all()
    if not accounts:
        raise HTTPException(status_code=404, detail="Accounts not found")
        
    result = {}
    for acc in accounts:
        # Get latest followers
        latest_snapshot = db.query(DailySnapshot).filter(DailySnapshot.account_id == acc.id).order_by(DailySnapshot.date.desc()).first()
        subs = latest_snapshot.followers_count if latest_snapshot and latest_snapshot.followers_count else 0
        
        # Calculate total views
        views = db.query(func.sum(Media.views)).filter(Media.account_id == acc.id).scalar() or 0
        
        
        # Get top content
        top_media = db.query(Media).filter(Media.account_id == acc.id).order_by(Media.views.desc()).limit(3).all()
        
        top_content = []
        for m in top_media:
            title = m.caption[:30] + "..." if m.caption else "Untitled"
            top_content.append(ContentItem(title=title, views=m.views))
            
        result[acc.username] = AccountComparisonData(
            username=acc.username,
            platform=acc.platform,
            metrics=AccountMetrics(
                views=views,
                subs=subs
            ),
            top_content=top_content
        )
        
    return ComparisonResponse(comparisons=result)
