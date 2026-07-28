from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from datetime import datetime
from core.database import Base

class CreatorProfile(Base):
    __tablename__ = "creator_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    account_type = Column(String)
    avatar_color = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProfileMemory(Base):
    __tablename__ = "profile_memories"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("creator_profiles.id"))
    memory_json = Column(JSON, default={})
    fingerprint_json = Column(JSON, default={})
    evolution_timeline = Column(JSON, default=[])
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
