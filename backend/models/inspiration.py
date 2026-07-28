from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from core.database import Base

class InspirationCard(Base):
    __tablename__ = "inspiration_cards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    url = Column(String)
    platform = Column(String)
    creator = Column(String)
    date_added = Column(DateTime(timezone=True), server_default=func.now())
    category = Column(String)
    tags = Column(JSON)
    analysis_json = Column(JSON)
    status = Column(String, default="new")
