from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from domains.accounts.service import AccountsService, AccountsRepository
from domains.analytics.service import AnalyticsService, AnalyticsRepository

router = APIRouter()

def get_accounts_service():
    return AccountsService(AccountsRepository())

def get_analytics_service():
    return AnalyticsService(AnalyticsRepository())

class ContentItem(BaseModel):
    title: str
    views: int
    revenue: float

class AccountMetrics(BaseModel):
    views: float = 0.0
    subs: float = 0.0
    revenue: float = 0.0

class AccountComparisonData(BaseModel):
    username: str
    platform: str
    metrics: AccountMetrics
    top_content: List[ContentItem]

class ComparisonResponse(BaseModel):
    comparisons: Dict[str, AccountComparisonData]

@router.get("/", response_model=ComparisonResponse)
def compare_accounts(
    usernames: List[str] = Query(..., description="List of usernames to compare"),
    accounts_service: AccountsService = Depends(get_accounts_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    if len(usernames) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two usernames to compare")
        
    accounts = accounts_service.get_accounts_by_usernames(usernames)
    if not accounts:
        raise HTTPException(status_code=404, detail="Accounts not found")
        
    account_ids = [acc["id"] for acc in accounts]
    comparison_data = analytics_service.get_comparison_data(account_ids)
    
    result = {}
    for acc in accounts:
        aid = acc["id"]
        data = comparison_data.get(aid, {"metrics": {}, "top_content": []})
        result[acc["username"]] = AccountComparisonData(
            username=acc["username"],
            platform=acc["platform"],
            metrics=AccountMetrics(
                views=data["metrics"].get("views", 0),
                subs=data["metrics"].get("subs", 0),
                revenue=data["metrics"].get("revenue", 0)
            ),
            top_content=[ContentItem(**c) for c in data["top_content"]]
        )
        
    return ComparisonResponse(comparisons=result)
