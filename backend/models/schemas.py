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
