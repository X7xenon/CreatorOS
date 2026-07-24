from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(String, primary_key=True, index=True)
    platform = Column(String, index=True) # "YouTube" or "Instagram"
    username = Column(String, index=True)
    type = Column(String, default="OWNER") # OWNER or COMPETITOR
    encrypted_session_data = Column(String, nullable=True) # Base64 encoded encrypted string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    media = relationship("Media", back_populates="account")
    events = relationship("Event", back_populates="account")
    snapshots = relationship("DailySnapshot", back_populates="account")
    calendar_events = relationship("CalendarEvent", back_populates="account")

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("connected_accounts.id"))
    platform = Column(String)
    title = Column(String)
    status = Column(String) # Scheduled, Draft, Published, Failed
    scheduled_time = Column(DateTime)
    thumbnail = Column(String, nullable=True)
    color = Column(String, nullable=True)
    sent_reminders = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    account = relationship("ConnectedAccount", back_populates="calendar_events")

class Media(Base):
    __tablename__ = "media"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("connected_accounts.id"))
    platform_media_id = Column(String, index=True)
    media_type = Column(String) # VIDEO, IMAGE, CAROUSEL
    caption = Column(String)
    created_at = Column(DateTime)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    views = Column(Integer, default=0)
    duration = Column(Integer, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    permalink = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    account = relationship("ConnectedAccount", back_populates="media")
    metadata_rel = relationship("MediaMetadata", back_populates="media", uselist=False)

class MediaMetadata(Base):
    __tablename__ = "media_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(String, ForeignKey("media.id"))
    hashtags = Column(JSON, nullable=True)
    mentions = Column(JSON, nullable=True)
    emoji_count = Column(Integer, default=0)
    upload_hour = Column(Integer)
    upload_weekday = Column(Integer)
    
    media = relationship("Media", back_populates="metadata_rel")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("connected_accounts.id"))
    event_type = Column(String)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    account = relationship("ConnectedAccount", back_populates="events")

class DailySnapshot(Base):
    __tablename__ = "daily_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("connected_accounts.id"))
    date = Column(String) # YYYY-MM-DD
    followers_count = Column(Integer)
    following_count = Column(Integer)
    total_posts = Column(Integer)
    total_likes = Column(Integer, default=0)
    
    account = relationship("ConnectedAccount", back_populates="snapshots")
