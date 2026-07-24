"""
Proxy Manager Service
Manages the full lifecycle of proxy server entries:
  - assign / get / release proxies per account
  - health checks (connectivity, HTTPS, response time)
  - marking proxies as DEAD on repeated failures
  - disabling proxies manually
Platform-agnostic: works for Instagram, TikTok, X, etc.
"""
import uuid
import time
import logging
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from models.account import Proxy, ConnectedAccount
from core.security import encrypt_data, decrypt_data
from core.event_bus import event_bus

logger = logging.getLogger(__name__)

PROXY_TEST_URL = "https://api.ipify.org?format=json"
MAX_FAIL_COUNT = 3  # After this many failures proxy is marked DEAD


class ProxyService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------ #
    #  CRUD                                                                #
    # ------------------------------------------------------------------ #

    def create_proxy(
        self,
        proxy_url: str,
        name: str = None,
        proxy_type: str = "Datacenter",
        provider: str = None,
        country: str = None,
        sticky_session_id: str = None,
        notes: str = None,
    ) -> Proxy:
        """Create a new proxy entry with the URL stored encrypted."""
        proxy = Proxy(
            id=f"prx_{uuid.uuid4().hex[:12]}",
            name=name or proxy_url[:30],
            proxy_url_encrypted=encrypt_data(proxy_url).decode("utf-8"),
            proxy_type=proxy_type,
            provider=provider,
            country=country,
            sticky_session_id=sticky_session_id,
            notes=notes,
            status="ACTIVE",
        )
        self.db.add(proxy)
        self.db.commit()
        self.db.refresh(proxy)
        logger.info(f"[ProxyService] Created proxy {proxy.id} ({proxy.name})")
        return proxy

    def get_all_proxies(self) -> list[Proxy]:
        return self.db.query(Proxy).order_by(Proxy.created_at.desc()).all()

    def get_proxy_by_id(self, proxy_id: str) -> Proxy | None:
        return self.db.query(Proxy).filter(Proxy.id == proxy_id).first()

    def delete_proxy(self, proxy_id: str) -> bool:
        proxy = self.get_proxy_by_id(proxy_id)
        if not proxy:
            return False
        # Unlink any accounts using this proxy first
        self.db.query(ConnectedAccount).filter(
            ConnectedAccount.proxy_id == proxy_id
        ).update({"proxy_id": None})
        self.db.delete(proxy)
        self.db.commit()
        return True

    # ------------------------------------------------------------------ #
    #  Assignment                                                          #
    # ------------------------------------------------------------------ #

    def assign_proxy(self, account_id: str, proxy_id: str) -> bool:
        """Bind a specific proxy to an account (sticky assignment)."""
        account = self.db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()
        proxy = self.get_proxy_by_id(proxy_id)
        if not account or not proxy:
            return False
        if proxy.status != "ACTIVE":
            logger.warning(f"[ProxyService] Tried to assign non-ACTIVE proxy {proxy_id} to {account_id}")
            return False
        account.proxy_id = proxy_id
        proxy.last_used = datetime.utcnow()
        self.db.commit()
        logger.info(f"[ProxyService] Assigned proxy {proxy_id} -> account {account_id}")
        return True

    def get_proxy(self, account_id: str) -> str | None:
        """
        Returns the decrypted proxy URL for the given account.
        Returns None if no proxy is assigned or if the proxy is not ACTIVE.
        """
        account = self.db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()
        if not account or not account.proxy_id:
            return None

        proxy = self.get_proxy_by_id(account.proxy_id)
        if not proxy or proxy.status != "ACTIVE":
            return None

        proxy.last_used = datetime.utcnow()
        self.db.commit()
        return decrypt_data(proxy.proxy_url_encrypted)

    def release_proxy(self, account_id: str) -> bool:
        """Unbind the proxy from an account."""
        account = self.db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()
        if not account:
            return False
        account.proxy_id = None
        self.db.commit()
        return True

    # ------------------------------------------------------------------ #
    #  Health & Lifecycle                                                  #
    # ------------------------------------------------------------------ #

    def mark_failed(self, proxy_id: str) -> Proxy | None:
        """Increment fail count. Auto-mark as DEAD after MAX_FAIL_COUNT."""
        proxy = self.get_proxy_by_id(proxy_id)
        if not proxy:
            return None
        proxy.fail_count += 1
        if proxy.fail_count >= MAX_FAIL_COUNT:
            proxy.status = "DEAD"
            logger.warning(f"[ProxyService] Proxy {proxy_id} marked DEAD after {proxy.fail_count} failures")
        self.db.commit()
        self.db.refresh(proxy)
        return proxy

    def disable_proxy(self, proxy_id: str) -> bool:
        """Manually disable a proxy."""
        proxy = self.get_proxy_by_id(proxy_id)
        if not proxy:
            return False
        proxy.status = "DISABLED"
        self.db.commit()
        logger.info(f"[ProxyService] Proxy {proxy_id} manually disabled")
        return True

    def enable_proxy(self, proxy_id: str) -> bool:
        """Re-enable a disabled or dead proxy (resets fail count)."""
        proxy = self.get_proxy_by_id(proxy_id)
        if not proxy:
            return False
        proxy.status = "ACTIVE"
        proxy.fail_count = 0
        self.db.commit()
        return True

    def validate_proxy(self, proxy_url: str) -> dict:
        """Test a proxy URL for connectivity and measure response time. Returns a result dict."""
        start = time.monotonic()
        try:
            with httpx.Client(proxies={"https://": proxy_url, "http://": proxy_url}, timeout=10) as client:
                r = client.get(PROXY_TEST_URL)
                elapsed_ms = round((time.monotonic() - start) * 1000, 2)
                if r.status_code == 200:
                    ip = r.json().get("ip", "unknown")
                    return {"alive": True, "ip": ip, "response_time_ms": elapsed_ms}
        except Exception as e:
            elapsed_ms = round((time.monotonic() - start) * 1000, 2)
            return {"alive": False, "error": str(e), "response_time_ms": elapsed_ms}
        return {"alive": False, "error": "Unknown error"}

    def test_and_update_proxy(self, proxy_id: str) -> dict:
        """Test a stored proxy by ID and update its health fields in the database."""
        proxy = self.get_proxy_by_id(proxy_id)
        if not proxy:
            return {"error": "Proxy not found"}

        proxy_url = decrypt_data(proxy.proxy_url_encrypted)
        result = self.validate_proxy(proxy_url)

        proxy.last_checked = datetime.utcnow()
        if result["alive"]:
            proxy.response_time_ms = result.get("response_time_ms")
            if proxy.status == "DEAD":  # Recovered
                proxy.fail_count = 0
                proxy.status = "ACTIVE"
        else:
            proxy.fail_count += 1
            if proxy.fail_count >= MAX_FAIL_COUNT:
                proxy.status = "DEAD"

        self.db.commit()
        return result

    # ------------------------------------------------------------------ #
    #  Scheduled Health Check (called by APScheduler)                     #
    # ------------------------------------------------------------------ #

    async def health_check_all(self):
        """Check all ACTIVE proxies and update their statuses. Notify on failures."""
        proxies = self.db.query(Proxy).filter(Proxy.status == "ACTIVE").all()
        dead_proxies = []

        for proxy in proxies:
            result = self.test_and_update_proxy(proxy.id)
            if not result.get("alive") and proxy.status == "DEAD":
                dead_proxies.append(proxy)

        # Notify via EventBus for any proxy that just died
        for proxy in dead_proxies:
            # Find accounts that were using this proxy
            affected = self.db.query(ConnectedAccount).filter(
                ConnectedAccount.proxy_id == proxy.id
            ).all()
            affected_usernames = [a.username for a in affected]
            await event_bus.publish("proxy_health_alert", {
                "proxy_id": proxy.id,
                "proxy_name": proxy.name,
                "status": "DEAD",
                "affected_accounts": affected_usernames,
                "message": (
                    f"⚠️ *CreatorOS Alert*\n\nProxy *{proxy.name}* has gone DEAD.\n"
                    f"Affected accounts: {', '.join(affected_usernames) or 'None'}\n\n"
                    f"Syncing is paused for these accounts. Please reassign a proxy."
                )
            })
        logger.info(f"[ProxyService] Health check complete. {len(dead_proxies)} proxies marked DEAD.")
