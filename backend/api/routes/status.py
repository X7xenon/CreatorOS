from fastapi import APIRouter
from services.status_service import get_overall_status, update_service_status
from models.schemas import StatusSchema

router = APIRouter(prefix="/status", tags=["status"])

@router.get("/")
def get_status():
    return get_overall_status()

@router.post("/")
def update_status(status: StatusSchema):
    return update_service_status(status)
