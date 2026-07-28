from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON
from datetime import datetime
import uuid
from core.database import Base

class SyncQueueItem(Base):
    __tablename__ = "sync_queue"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_ip = Column(String, nullable=False)
    entity_type = Column(String, nullable=False) # script, memory, calendar_event
    entity_id = Column(String, nullable=False)
    operation = Column(String, nullable=False) # create, update, delete
    payload_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    synced_at = Column(DateTime, nullable=True)
    conflict_strategy = Column(String, default="last-write-wins")
