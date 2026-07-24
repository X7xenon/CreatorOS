from fastapi import APIRouter
from services.accounts_service import list_accounts

router = APIRouter(prefix="/api/accounts", tags=["accounts"])

@router.get("/")
def get_accounts():
    return list_accounts()
