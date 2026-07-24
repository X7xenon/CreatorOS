from apscheduler.schedulers.asyncio import AsyncIOScheduler
from core.event_bus import event_bus
from workers.collector import sync_daily_snapshots, sync_recent_media
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

from core.database import SessionLocal
from services.mission_service import MissionService
from services.proxy_service import ProxyService
from database.repositories.accounts_repo import AccountsRepository
from models.account import Media, CalendarEvent
from sqlalchemy import func

# Global counter to simulate small tick activity per account
simulated_views_offset_by_account = {}

async def emit_live_activity():
    global simulated_views_offset_by_account
    db = SessionLocal()
    try:
        # Fetch real views from SQLite grouped by account, along with platform
        from models.account import ConnectedAccount
        views_data = db.query(Media.account_id, ConnectedAccount.platform, func.sum(Media.views)).join(ConnectedAccount).group_by(Media.account_id).all()
        real_revenue = db.query(func.sum(Media.likes)).scalar() or 0 # Reusing likes for mock revenue
    finally:
        db.close()
        
    views_response = {}
    platform_views = {'YouTube': 0, 'Instagram': 0}
    total_current_views = 0
    total_change = 0
    
    for account_id, platform, real_views in views_data:
        real_views = real_views or 0
        if account_id not in simulated_views_offset_by_account:
            simulated_views_offset_by_account[account_id] = 0
            
        change = random.randint(-1, 3)
        simulated_views_offset_by_account[account_id] += change
        
        if simulated_views_offset_by_account[account_id] < 0 and real_views == 0:
            simulated_views_offset_by_account[account_id] = 0
            
        current = real_views + simulated_views_offset_by_account[account_id]
        views_response[account_id] = current
        
        if platform in platform_views:
            platform_views[platform] += current
            
        total_current_views += current
        total_change += change
        
    views_response['all'] = total_current_views
    views_response['platform_YouTube'] = platform_views['YouTube']
    views_response['platform_Instagram'] = platform_views['Instagram']
    
    # Generate a realistic message based on the total change
    if total_change > 3:
        msg = f"Traffic spike! +{total_change} viewers"
    elif total_change > 0:
        msg = f"Steady growth: +{total_change} viewers"
    elif total_change < 0:
        msg = f"Audience dip: {abs(total_change)} viewers"
    else:
        msg = "Audience stable"
        
    await event_bus.publish("live_activity", {
        "message": msg,
        "stats": {
            "views": views_response,
            "revenue": real_revenue
        }
    })

def check_upcoming_events():
    from core.config import settings
    from notifications.whatsapp import WhatsAppNotificationProvider
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        upcoming_events = db.query(CalendarEvent).filter(CalendarEvent.status == 'Scheduled').all()
        
        provider = WhatsAppNotificationProvider()
        
        for event in upcoming_events:
            if not event.scheduled_time:
                continue
                
            delta = event.scheduled_time - now
            minutes_until = int(delta.total_seconds() / 60)
            
            sent_list = event.sent_reminders.split(',') if event.sent_reminders else []
            
            for schedule_min in sorted(settings.reminder_schedules_minutes, reverse=True):
                if minutes_until <= schedule_min and minutes_until >= 0 and str(schedule_min) not in sent_list:
                    emoji = "📸" if event.platform == "Instagram" else "🎥" if event.platform == "YouTube" else "🎵"
                    
                    msg = f"📅 *CreatorOS Reminder*\n\nPlatform: {emoji} {event.platform}\nTitle: {event.title}\nScheduled: {event.scheduled_time.strftime('%I:%M %p UTC')}\nStarts in: {schedule_min} minutes\n\nOpen CreatorOS to publish!"
                    
                    if provider.send(msg):
                        logger.info(f"[Reminder] Platform: {event.platform} | Status: SUCCESS")
                        sent_list.append(str(schedule_min))
                        event.sent_reminders = ",".join(sent_list)
                        db.commit()
                    else:
                        logger.info(f"[Reminder] Platform: {event.platform} | Status: FAILED (Will retry)")
                    
                    break
    except Exception as e:
        logger.error(f"Error checking upcoming events: {e}")
    finally:
        db.close()

async def evaluate_missions():
    db = SessionLocal()
    try:
        accounts_repo = AccountsRepository(db)
        mission_service = MissionService(db)
        accounts = accounts_repo.get_all_accounts()
        for account in accounts:
            await mission_service.evaluate_milestones(account.id)
            await mission_service.update_goals_progress(account.id)
    except Exception as e:
        logger.error(f"Error evaluating missions: {e}")
    finally:
        db.close()

async def check_proxies_health():
    """Scheduled job: test all ACTIVE proxies and mark dead ones."""
    db = SessionLocal()
    try:
        proxy_svc = ProxyService(db)
        await proxy_svc.health_check_all()
    except Exception as e:
        logger.error(f"Error during proxy health check: {e}")
    finally:
        db.close()

def start_scheduler():
    # Run every 15 minutes
    scheduler.add_job(sync_daily_snapshots, 'interval', minutes=15)
    scheduler.add_job(sync_recent_media, 'interval', minutes=15)
    scheduler.add_job(evaluate_missions, 'interval', minutes=15)
    scheduler.add_job(check_proxies_health, 'interval', minutes=15)
    
    # Run every 2 minutes to check upcoming calendar events
    scheduler.add_job(check_upcoming_events, 'interval', minutes=2)
    
    # Run every 5 seconds for live activity stream
    scheduler.add_job(emit_live_activity, 'interval', seconds=5)
    
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()
