from sqlalchemy import Column, Integer, String, JSON, DateTime, Text
from datetime import datetime
from core.database import Base

class CompiledAsset(Base):
    __tablename__ = "compiled_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, index=True)
    target_format = Column(String, default='script')
    compiled_text = Column(Text)
    metadata_json = Column(JSON, default={})
    metrics_json = Column(JSON, default={})
    version = Column(Integer, default=1)
    hash = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
