from core.database import SessionLocal
from models.account import ConnectedAccount, DailySnapshot, Media, Event
from core.security import decrypt_data
from providers.instagram import InstagrapiProvider
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def sync_daily_snapshots():
    """Run daily to fetch basic profile stats for all connected accounts."""
    db = SessionLocal()
    try:
        accounts = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "Instagram").all()
        provider = InstagrapiProvider()
        
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        for account in accounts:
            if not account.encrypted_session_data:
                continue
                
            try:
                session_data = decrypt_data(account.encrypted_session_data)
                profile = provider.fetch_profile(session_data, account.username)
                
                # Check if snapshot for today exists
                snapshot = db.query(DailySnapshot).filter(DailySnapshot.account_id == account.id, DailySnapshot.date == today).first()
                if snapshot:
                    snapshot.followers_count = profile["followers_count"]
                    snapshot.following_count = profile["following_count"]
                    snapshot.total_posts = profile["total_posts"]
                else:
                    snapshot = DailySnapshot(
                        account_id=account.id,
                        date=today,
                        followers_count=profile["followers_count"],
                        following_count=profile["following_count"],
                        total_posts=profile["total_posts"]
                    )
                    db.add(snapshot)
                
                # Log Event
                event = Event(
                    account_id=account.id,
                    event_type="PROFILE_SYNC_SUCCESS",
                    details={"followers": profile["followers_count"]}
                )
                db.add(event)
                
                db.commit()
                logger.info(f"Successfully synced daily snapshot for account {account.id}")
                
            except Exception as e:
                logger.error(f"Error syncing account {account.id}: {str(e)}")
                db.rollback()
                
    finally:
        db.close()


def sync_recent_media():
    """Run every 6 hours to fetch/update recent media metrics."""
    db = SessionLocal()
    try:
        accounts = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "Instagram").all()
        provider = InstagrapiProvider()
        
        for account in accounts:
            if not account.encrypted_session_data:
                continue
                
            try:
                session_data = decrypt_data(account.encrypted_session_data)
                medias = provider.fetch_recent_media(session_data, account.username, limit=12)
                
                for m_data in medias:
                    # Check if exists
                    existing = db.query(Media).filter(Media.platform_media_id == m_data["platform_media_id"]).first()
                    
                    if existing:
                        existing.likes = m_data["likes"]
                        existing.comments = m_data["comments"]
                        existing.views = m_data["views"]
                        existing.last_updated = datetime.utcnow()
                    else:
                        new_media = Media(
                            id=f"med_{m_data['platform_media_id']}",
                            account_id=account.id,
                            platform_media_id=m_data["platform_media_id"],
                            media_type=m_data["media_type"],
                            caption=m_data["caption"],
                            created_at=m_data["created_at"],
                            likes=m_data["likes"],
                            comments=m_data["comments"],
                            views=m_data["views"],
                            thumbnail_url=m_data["thumbnail_url"]
                        )
                        db.add(new_media)
                        
                db.commit()
                logger.info(f"Successfully synced media for account {account.id}")
                
            except Exception as e:
                logger.error(f"Error syncing media for account {account.id}: {str(e)}")
                db.rollback()
    finally:
        db.close()
