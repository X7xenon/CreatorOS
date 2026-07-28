from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON
from datetime import datetime
from core.database import Base

class TrustedDevice(Base):
    __tablename__ = "trusted_devices"
    id = Column(String, primary_key=True) # tailscale ip is good ID
    tailscale_ip = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    platform = Column(String, nullable=True) # android, windows, linux, ipad
    browser = Column(String, nullable=True)
    screen_width = Column(Integer, nullable=True)
    screen_height = Column(Integer, nullable=True)
    last_seen = Column(DateTime, default=datetime.utcnow)
    trusted = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)
