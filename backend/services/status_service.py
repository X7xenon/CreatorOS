from database.repositories.status_repo import get_all_statuses, get_status_by_service, upsert_status
from models.schemas import StatusSchema

def get_overall_status():
    statuses = get_all_statuses()
    return {"status": "ok", "services": statuses}

def check_service_status(service_name: str):
    status = get_status_by_service(service_name)
    return status

def update_service_status(status_data: StatusSchema):
    upsert_status(status_data.service_name, status_data.is_active)
    return get_status_by_service(status_data.service_name)
