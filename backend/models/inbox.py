from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON
from datetime import datetime
import uuid
from core.database import Base

class InboxItem(Base):
    __tablename__ = "inbox_items"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    filetype = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    path = Column(String, nullable=False)
    device_name = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
