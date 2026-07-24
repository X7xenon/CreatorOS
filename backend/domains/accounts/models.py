from pydantic import BaseModel, Field
from datetime import datetime, timezone

class AccountBase(BaseModel):
    username: str
    platform: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int
