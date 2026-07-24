from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.account import ConnectedAccount, DailySnapshot, Media
from typing import Optional, List
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(account_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DailySnapshot)
    if account_id and account_id != 'all':
        query = query.filter(DailySnapshot.account_id == account_id)
        
    snapshots = query.order_by(DailySnapshot.date.desc()).limit(30).all()
    
    if account_id and account_id != 'all':
        total_followers = sum(s.followers_count or 0 for s in snapshots[:1])
    else:
        accounts = db.query(DailySnapshot.account_id).distinct().all()
        total_followers = 0
        for acc in accounts:
            latest = db.query(DailySnapshot).filter(DailySnapshot.account_id == acc[0]).order_by(DailySnapshot.date.desc()).first()
            if latest:
                total_followers += (latest.followers_count or 0)
    
    media_query = db.query(Media)
    if account_id and account_id != 'all':
        media_query = media_query.filter(Media.account_id == account_id)
    
    total_views = db.query(func.sum(Media.views)).filter(Media.account_id == account_id).scalar() if account_id and account_id != 'all' else db.query(func.sum(Media.views)).scalar()
    total_views = total_views or 0
    
    total_likes = db.query(func.sum(Media.likes)).filter(Media.account_id == account_id).scalar() if account_id and account_id != 'all' else db.query(func.sum(Media.likes)).scalar()
    total_likes = total_likes or 0
    
    return {
        "total_followers": total_followers,
        "total_views": total_views,
        "total_likes": total_likes,
    }

@router.get("/top-videos")
def get_top_videos(account_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Media)
    if account_id and account_id != 'all':
        query = query.filter(Media.account_id == account_id)
        
    top_media = query.order_by(Media.views.desc()).limit(6).all()
    
    return [
        {
            "id": m.id,
            "title": m.caption[:30] + "..." if m.caption else "Untitled",
            "platform": m.account.platform if m.account else "Unknown",
            "account": m.account.username if m.account else "Unknown",
            "views": m.views,
            "likes": m.likes,
            "thumbnail": m.thumbnail_url
        } for m in top_media
    ]

@router.get("/analytics/detailed")
def get_detailed_analytics(account_id: Optional[str] = None, db: Session = Depends(get_db)):
    # 1. Follower Growth (Line Chart)
    # We will get the last 30 snapshots for the account
    snapshot_query = db.query(DailySnapshot)
    if account_id and account_id != 'all':
        snapshot_query = snapshot_query.filter(DailySnapshot.account_id == account_id)
        
    # For a real graph, we want chronological order, but limit to last 30 days
    # In SQLite, date string sorting works if YYYY-MM-DD
    recent_snapshots = snapshot_query.order_by(DailySnapshot.date.desc()).limit(30).all()
    recent_snapshots.reverse()
    
    follower_growth = [
        {"date": s.date, "followers": s.followers_count} for s in recent_snapshots
    ]
    
    # 2. Media Performance (Views vs Likes vs Comments)
    media_query = db.query(Media)
    if account_id and account_id != 'all':
        media_query = media_query.filter(Media.account_id == account_id)
        
    total_views = db.query(func.sum(Media.views)).filter(Media.account_id == account_id).scalar() if account_id and account_id != 'all' else db.query(func.sum(Media.views)).scalar()
    total_views = total_views or 0
    
    total_likes = db.query(func.sum(Media.likes)).filter(Media.account_id == account_id).scalar() if account_id and account_id != 'all' else db.query(func.sum(Media.likes)).scalar()
    total_likes = total_likes or 0
    
    total_comments = db.query(func.sum(Media.comments)).filter(Media.account_id == account_id).scalar() if account_id and account_id != 'all' else db.query(func.sum(Media.comments)).scalar()
    total_comments = total_comments or 0
    
    engagement_rate = 0
    if total_views > 0:
        engagement_rate = round(((total_likes + total_comments) / total_views) * 100, 2)
        
    # 3. Recent Reels (Bar Chart)
    recent_media = media_query.order_by(Media.created_at.desc()).limit(10).all()
    recent_media.reverse()
    
    recent_reels = [
        {"id": m.id, "caption": m.caption[:15] + "..." if m.caption else "Reel", "views": m.views, "likes": m.likes}
        for m in recent_media
    ]
    
    return {
        "engagement_rate": engagement_rate,
        "watch_time_hours": total_views * 0.05, # mock derived stat
        "ctr": 8.4, # mock stat
        "follower_growth": follower_growth,
        "media_performance": {
            "Views": total_views,
            "Likes": total_likes,
            "Comments": total_comments
        },
        "recent_reels": recent_reels
    }
