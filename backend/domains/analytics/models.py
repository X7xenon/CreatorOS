from pydantic import BaseModel, Field
from datetime import datetime, timezone

class AnalyticsMetricBase(BaseModel):
    account_id: int
    metric_name: str
    value: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalyticsMetricCreate(AnalyticsMetricBase):
    pass

class AnalyticsMetric(AnalyticsMetricBase):
    id: int
