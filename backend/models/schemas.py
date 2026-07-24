from pydantic import BaseModel
from typing import Optional

class StatusSchema(BaseModel):
    service_name: str
    is_active: bool
    last_checked: Optional[str] = None

class AccountSchema(BaseModel):
    id: int
    username: str
    email: str
    created_at: Optional[str] = None

class AnalyticsSchema(BaseModel):
    id: int
    account_id: int
    race_name: str
    lap_time: float
    top_speed: float

class GoalCreate(BaseModel):
    title: str
    category: str
    target_metric: str
    target_value: int
    deadline: Optional[str] = None
    account_id: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    title: str
    category: str
    target_metric: str
    target_value: int
    current_value: int
    deadline: Optional[str] = None
    status: str
    ai_suggestion: Optional[str] = None
    account_id: Optional[str] = None
    
    class Config:
        orm_mode = True

class AchievementResponse(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    unlocked_at: str
    account_id: Optional[str] = None
    
    class Config:
        orm_mode = True
