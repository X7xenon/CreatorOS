"""
Proxy Manager API
Endpoints for the Proxy Dashboard UI.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from core.database import SessionLocal
from services.proxy_service import ProxyService

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_proxy_service(db: Session = Depends(get_db)):
    return ProxyService(db)


# ------------------------------------------------------------------ #
#  Schemas                                                             #
# ------------------------------------------------------------------ #

class ProxyCreate(BaseModel):
    proxy_url: str
    name: Optional[str] = None
    proxy_type: Optional[str] = "Datacenter"
    provider: Optional[str] = None
    country: Optional[str] = None
    sticky_session_id: Optional[str] = None
    notes: Optional[str] = None


class BulkImportRequest(BaseModel):
    """Each entry is a raw proxy URL: protocol://user:pass@host:port"""
    proxy_urls: list[str]
    proxy_type: Optional[str] = "Datacenter"
    provider: Optional[str] = None
    country: Optional[str] = None


class AssignProxyRequest(BaseModel):
    account_id: str
    proxy_id: str


class TestProxyRequest(BaseModel):
    proxy_url: str


def _serialize_proxy(proxy, db: Session):
    """Convert Proxy ORM object to JSON-safe dict (never expose raw encrypted URL)."""
    from models.account import ConnectedAccount
    assigned_accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.proxy_id == proxy.id
    ).all()
    return {
        "id": proxy.id,
        "name": proxy.name,
        "proxy_type": proxy.proxy_type,
        "provider": proxy.provider,
        "country": proxy.country,
        "sticky_session_id": proxy.sticky_session_id,
        "status": proxy.status,
        "last_checked": proxy.last_checked.isoformat() if proxy.last_checked else None,
        "last_used": proxy.last_used.isoformat() if proxy.last_used else None,
        "fail_count": proxy.fail_count,
        "response_time_ms": proxy.response_time_ms,
        "notes": proxy.notes,
        "created_at": proxy.created_at.isoformat(),
        "assigned_accounts": [
            {"id": a.id, "username": a.username, "platform": a.platform}
            for a in assigned_accounts
        ],
    }


# ------------------------------------------------------------------ #
#  Routes                                                              #
# ------------------------------------------------------------------ #

@router.get("", include_in_schema=True)
@router.get("/")
def list_proxies(svc: ProxyService = Depends(get_proxy_service), db: Session = Depends(get_db)):
    proxies = svc.get_all_proxies()
    return [_serialize_proxy(p, db) for p in proxies]


@router.post("", status_code=201)
@router.post("/", status_code=201)
def create_proxy(body: ProxyCreate, svc: ProxyService = Depends(get_proxy_service), db: Session = Depends(get_db)):
    proxy = svc.create_proxy(
        proxy_url=body.proxy_url,
        name=body.name,
        proxy_type=body.proxy_type,
        provider=body.provider,
        country=body.country,
        sticky_session_id=body.sticky_session_id,
        notes=body.notes,
    )
    return _serialize_proxy(proxy, db)


@router.post("/import", status_code=201)
def bulk_import_proxies(body: BulkImportRequest, svc: ProxyService = Depends(get_proxy_service), db: Session = Depends(get_db)):
    """Bulk import a list of raw proxy URLs."""
    created = []
    for url in body.proxy_urls:
        url = url.strip()
        if not url:
            continue
        proxy = svc.create_proxy(
            proxy_url=url,
            proxy_type=body.proxy_type,
            provider=body.provider,
            country=body.country,
        )
        created.append(_serialize_proxy(proxy, db))
    return {"imported": len(created), "proxies": created}


# ── Static routes MUST come before /{proxy_id} to avoid being swallowed ──

@router.post("/test-url")
def test_proxy_url(body: TestProxyRequest, svc: ProxyService = Depends(get_proxy_service)):
    """Test an arbitrary proxy URL without saving it."""
    return svc.validate_proxy(body.proxy_url)


@router.post("/assign")
def assign_proxy(body: AssignProxyRequest, svc: ProxyService = Depends(get_proxy_service)):
    success = svc.assign_proxy(body.account_id, body.proxy_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not assign proxy. Check that both IDs are valid and proxy is ACTIVE.")
    return {"message": f"Proxy {body.proxy_id} assigned to account {body.account_id}"}


@router.get("/export")
def export_proxies(svc: ProxyService = Depends(get_proxy_service), db: Session = Depends(get_db)):
    """Export all proxies as JSON (without raw URLs for security)."""
    proxies = svc.get_all_proxies()
    return [_serialize_proxy(p, db) for p in proxies]


# ── Parameterized routes below ──

@router.delete("/{proxy_id}")
def delete_proxy(proxy_id: str, svc: ProxyService = Depends(get_proxy_service)):
    if not svc.delete_proxy(proxy_id):
        raise HTTPException(status_code=404, detail="Proxy not found")
    return {"message": "Proxy deleted"}


@router.post("/{proxy_id}/test")
def test_proxy(proxy_id: str, svc: ProxyService = Depends(get_proxy_service)):
    result = svc.test_and_update_proxy(proxy_id)
    if "error" in result and result["error"] == "Proxy not found":
        raise HTTPException(status_code=404, detail="Proxy not found")
    return result


@router.post("/{proxy_id}/disable")
def disable_proxy(proxy_id: str, svc: ProxyService = Depends(get_proxy_service)):
    if not svc.disable_proxy(proxy_id):
        raise HTTPException(status_code=404, detail="Proxy not found")
    return {"message": "Proxy disabled"}


@router.post("/{proxy_id}/enable")
def enable_proxy(proxy_id: str, svc: ProxyService = Depends(get_proxy_service)):
    if not svc.enable_proxy(proxy_id):
        raise HTTPException(status_code=404, detail="Proxy not found")
    return {"message": "Proxy enabled and fail count reset"}


@router.post("/release/{account_id}")
def release_proxy(account_id: str, svc: ProxyService = Depends(get_proxy_service)):
    svc.release_proxy(account_id)
    return {"message": f"Proxy released from account {account_id}"}
