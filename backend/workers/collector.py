from core.database import SessionLocal
from models.account import ConnectedAccount, DailySnapshot, Media, Event
from core.security import decrypt_data
from providers.instagram import InstagrapiProvider
from services.proxy_service import ProxyService
from core.event_bus import event_bus
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def _get_proxy_for_account(account, db) -> str | None:
    """
    Safely fetch the proxy URL for an account.
    Returns None (and logs a warning) if the proxy is DEAD or DISABLED.
    If an account has no proxy assigned, returns None (no proxy used).
    """
    if not account.proxy_id:
        return None  # No proxy configured — proceed without one

    proxy_svc = ProxyService(db)
    proxy = proxy_svc.get_proxy_by_id(account.proxy_id)

    if not proxy:
        logger.warning(f"[Collector] Account {account.username}: assigned proxy {account.proxy_id} not found.")
        return None

    if proxy.status != "ACTIVE":
        logger.warning(
            f"[Collector] Skipping sync for {account.username} — "
            f"proxy '{proxy.name}' is {proxy.status}."
        )
        return "BLOCKED"  # Signal to skip this account

    return decrypt_data(proxy.proxy_url_encrypted)


def sync_daily_snapshots():
    """Run every 15 minutes to fetch basic profile stats for all connected accounts."""
    db = SessionLocal()
    try:
        accounts = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "Instagram").all()
        provider = InstagrapiProvider()
        today = datetime.utcnow().strftime("%Y-%m-%d")

        for account in accounts:
            if not account.encrypted_session_data:
                continue

            # --- Proxy Guard ---
            proxy_url = _get_proxy_for_account(account, db)
            if proxy_url == "BLOCKED":
                logger.info(f"[Collector] Skipped daily snapshot for {account.username} (proxy dead/disabled).")
                continue

            try:
                session_data = decrypt_data(account.encrypted_session_data)
                profile = provider.fetch_profile(session_data, account.username, proxy_url=proxy_url)

                snapshot = db.query(DailySnapshot).filter(
                    DailySnapshot.account_id == account.id,
                    DailySnapshot.date == today
                ).first()

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
                        total_posts=profile["total_posts"],
                    )
                    db.add(snapshot)

                event = Event(
                    account_id=account.id,
                    event_type="PROFILE_SYNC_SUCCESS",
                    details={"followers": profile["followers_count"]},
                )
                db.add(event)
                db.commit()
                logger.info(f"[Collector] Synced daily snapshot for {account.username}")

            except Exception as e:
                logger.error(f"[Collector] Error syncing {account.username}: {e}")
                # If the error is proxy-related, mark the proxy as failed
                if account.proxy_id and ("proxy" in str(e).lower() or "connect" in str(e).lower()):
                    ProxyService(db).mark_failed(account.proxy_id)
                db.rollback()

    finally:
        db.close()


def sync_recent_media():
    """Run every 15 minutes to fetch/update recent media metrics."""
    db = SessionLocal()
    try:
        accounts = db.query(ConnectedAccount).filter(ConnectedAccount.platform == "Instagram").all()
        provider = InstagrapiProvider()

        for account in accounts:
            if not account.encrypted_session_data:
                continue

            # --- Proxy Guard ---
            proxy_url = _get_proxy_for_account(account, db)
            if proxy_url == "BLOCKED":
                logger.info(f"[Collector] Skipped media sync for {account.username} (proxy dead/disabled).")
                continue

            try:
                session_data = decrypt_data(account.encrypted_session_data)
                medias = provider.fetch_recent_media(session_data, account.username, limit=12, proxy_url=proxy_url)

                for m_data in medias:
                    existing = db.query(Media).filter(
                        Media.platform_media_id == m_data["platform_media_id"]
                    ).first()

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
                            thumbnail_url=m_data["thumbnail_url"],
                        )
                        db.add(new_media)

                db.commit()
                logger.info(f"[Collector] Synced media for {account.username}")

            except Exception as e:
                logger.error(f"[Collector] Error syncing media for {account.username}: {e}")
                if account.proxy_id and ("proxy" in str(e).lower() or "connect" in str(e).lower()):
                    ProxyService(db).mark_failed(account.proxy_id)
                db.rollback()

    finally:
        db.close()
