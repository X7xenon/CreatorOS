from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from core.database import Base

class PromptHistory(Base):
    __tablename__ = "prompt_histories"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, index=True)
    block_id = Column(Integer, index=True)
    prompt_action = Column(String)
    previous_output = Column(Text)
    result_output = Column(Text)
    status = Column(String)
    feedback_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
