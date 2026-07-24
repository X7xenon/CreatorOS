from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.account import ConnectedAccount, DailySnapshot, Media
from typing import Optional, List
from datetime import datetime, timedelta

router = APIRouter()

def apply_account_filter(query, model, account_id: str):
    if not account_id or account_id == 'all':
        return query
    if account_id.startswith("platform_"):
        platform = account_id.split("_")[1]
        return query.join(ConnectedAccount, model.account_id == ConnectedAccount.id).filter(ConnectedAccount.platform == platform)
    return query.filter(model.account_id == account_id)

@router.get("/summary")
def get_dashboard_summary(account_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = apply_account_filter(db.query(DailySnapshot), DailySnapshot, account_id)
    snapshots = query.order_by(DailySnapshot.date.desc()).limit(30).all()
    
    # Calculate followers
    if account_id and account_id != 'all' and not account_id.startswith("platform_"):
        total_followers = sum(s.followers_count or 0 for s in snapshots[:1])
    else:
        accounts_query = db.query(DailySnapshot.account_id).distinct()
        accounts_query = apply_account_filter(accounts_query, DailySnapshot, account_id)
        accounts = accounts_query.all()
        
        total_followers = 0
        for acc in accounts:
            latest = db.query(DailySnapshot).filter(DailySnapshot.account_id == acc[0]).order_by(DailySnapshot.date.desc()).first()
            if latest:
                total_followers += (latest.followers_count or 0)
    
    # Calculate views and likes
    views_query = apply_account_filter(db.query(func.sum(Media.views)), Media, account_id)
    total_views = views_query.scalar() or 0
    
    likes_query = apply_account_filter(db.query(func.sum(Media.likes)), Media, account_id)
    total_likes = likes_query.scalar() or 0
    
    return {
        "total_followers": total_followers,
        "total_views": total_views,
        "total_likes": total_likes,
    }

@router.get("/top-videos")
def get_top_videos(account_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = apply_account_filter(db.query(Media), Media, account_id)
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
    snapshot_query = apply_account_filter(db.query(DailySnapshot), DailySnapshot, account_id)
    recent_snapshots = snapshot_query.order_by(DailySnapshot.date.desc()).limit(30).all()
    recent_snapshots.reverse()
    
    follower_growth = [
        {"date": s.date, "followers": s.followers_count} for s in recent_snapshots
    ]
    
    # 2. Media Performance (Views vs Likes vs Comments)
    total_views = apply_account_filter(db.query(func.sum(Media.views)), Media, account_id).scalar() or 0
    total_likes = apply_account_filter(db.query(func.sum(Media.likes)), Media, account_id).scalar() or 0
    total_comments = apply_account_filter(db.query(func.sum(Media.comments)), Media, account_id).scalar() or 0
    
    engagement_rate = 0
    if total_views > 0:
        engagement_rate = round(((total_likes + total_comments) / total_views) * 100, 2)
        
    # 3. Recent Reels (Bar Chart)
    media_query = apply_account_filter(db.query(Media), Media, account_id)
    recent_media = media_query.order_by(Media.created_at.desc()).limit(10).all()
    recent_media.reverse()
    
    recent_reels = [
        {"id": m.id, "caption": m.caption[:15] + "..." if m.caption else "Reel", "views": m.views, "likes": m.likes}
        for m in recent_media
    ]
    
    return {
        "engagement_rate": engagement_rate,
        "watch_time_hours": total_views * 0.05,
        "ctr": 8.4,
        "follower_growth": follower_growth,
        "media_performance": {
            "Views": total_views,
            "Likes": total_likes,
            "Comments": total_comments
        },
        "recent_reels": recent_reels
    }
