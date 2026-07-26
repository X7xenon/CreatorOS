from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Text
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class ContentAsset(Base):
    """Base model for Scripts, Blogs, Tweets, etc."""
    __tablename__ = "content_assets"

    id = Column(String, primary_key=True, index=True)
    type = Column(String, default="Script")  # Script, Blog, Tweet, Reel, Podcast
    title = Column(String, nullable=True)
    status = Column(String, default="Draft") # Draft, Analyzing, Ready, Published
    goal = Column(String, nullable=True)
    audience = Column(String, nullable=True)
    language = Column(String, default="en")
    health_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    blocks = relationship("ScriptBlock", back_populates="asset", cascade="all, delete-orphan")
    versions = relationship("AssetVersion", back_populates="asset", cascade="all, delete-orphan")


class ScriptBlock(Base):
    """Nested blocks for Story Builder"""
    __tablename__ = "script_blocks"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("content_assets.id"))
    parent_id = Column(String, ForeignKey("script_blocks.id"), nullable=True)  # For nested blocks
    
    type = Column(String)  # Hook, Problem, Story, Proof, CTA, Example
    content = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    
    # Optional metrics/AI data
    health_score = Column(Float, nullable=True)
    ai_suggestions = Column(JSON, nullable=True)

    asset = relationship("ContentAsset", back_populates="blocks")
    children = relationship("ScriptBlock", backref="parent", remote_side=[id])


class AssetVersion(Base):
    """Git-like version history for scripts"""
    __tablename__ = "asset_versions"

    id = Column(String, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey("content_assets.id"))
    version_num = Column(Integer)
    content = Column(JSON)  # Store the serialized blocks/state at this version
    
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("ContentAsset", back_populates="versions")


class Memory(Base):
    """Generic structured memory for AI (Hook, Story, Lesson, Winning Pattern)"""
    __tablename__ = "memories"

    id = Column(String, primary_key=True, index=True)
    type = Column(String) # Hook, Story, Lesson, Mistake, Pattern, Feedback
    source = Column(String, nullable=True) # "YouTube: ID", "Manual", "Script: ID"
    entity = Column(String, nullable=True) # The actual content/text
    metadata_json = Column(JSON, nullable=True)
    importance = Column(Float, default=1.0)
    embedding = Column(JSON, nullable=True) # Placeholder for vector embedding array
    
    created_at = Column(DateTime, default=datetime.utcnow)


class HookTemplate(Base):
    """Database-driven hooks"""
    __tablename__ = "hook_templates"

    id = Column(String, primary_key=True, index=True)
    category = Column(String) # Curiosity, Fear, Story, Question, Myth
    template = Column(Text)
    variables = Column(JSON, nullable=True)
    difficulty = Column(String, default="Beginner")
    tone = Column(String, default="Neutral")
    language = Column(String, default="en")


class KnowledgeNode(Base):
    """Second Brain Foundation"""
    __tablename__ = "knowledge_nodes"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    summary = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    relationships = Column(JSON, nullable=True) # Array of related node IDs
    references = Column(JSON, nullable=True) # URLs, Books, sources
    embedding = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class PromptTemplate(Base):
    """Versioning system for AI prompts"""
    __tablename__ = "prompt_templates"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    version = Column(Integer, default=1)
    role = Column(String, nullable=True) # System role persona
    template = Column(Text)
    variables = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
