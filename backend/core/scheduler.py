from apscheduler.schedulers.asyncio import AsyncIOScheduler
from core.event_bus import event_bus
from workers.collector import sync_daily_snapshots, sync_recent_media
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

from core.database import SessionLocal
from models.account import Media, CalendarEvent
from sqlalchemy import func

# Global counter to simulate small tick activity between 15-minute DB syncs
simulated_views_offset = 0

async def emit_live_activity():
    global simulated_views_offset
    db = SessionLocal()
    try:
        # Fetch real views from SQLite
        real_total_views = db.query(func.sum(Media.views)).scalar() or 0
        real_revenue = db.query(func.sum(Media.likes)).scalar() or 0 # Reusing likes for mock revenue
    finally:
        db.close()
        
    # Add a tiny realistic fluctuation
    change = random.randint(-2, 5)
    simulated_views_offset += change
    
    if simulated_views_offset < 0 and real_total_views == 0:
        simulated_views_offset = 0
        
    current_views = real_total_views + simulated_views_offset
    
    # Generate a realistic message based on the change
    if change > 3:
        msg = f"Traffic spike! +{change} viewers"
    elif change > 0:
        msg = f"Steady growth: +{change} viewers"
    elif change < 0:
        msg = f"Audience dip: {abs(change)} viewers"
    else:
        msg = "Audience stable"
        
    await event_bus.publish("live_activity", {
        "message": msg,
        "stats": {
            "views": current_views,
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

def start_scheduler():
    # Run every 15 minutes
    scheduler.add_job(sync_daily_snapshots, 'interval', minutes=15)
    scheduler.add_job(sync_recent_media, 'interval', minutes=15)
    
    # Run every 2 minutes to check upcoming calendar events
    scheduler.add_job(check_upcoming_events, 'interval', minutes=2)
    
    # Run every 5 seconds for live activity stream
    scheduler.add_job(emit_live_activity, 'interval', seconds=5)
    
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()
