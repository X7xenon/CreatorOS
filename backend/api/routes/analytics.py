from fastapi import APIRouter
from services.analytics_service import get_account_analytics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/{account_id}")
def get_analytics(account_id: int):
    return get_account_analytics(account_id)
