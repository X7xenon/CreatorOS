from database.connection import execute_query, fetch_all, fetch_one

def get_all_statuses():
    return fetch_all("SELECT * FROM status")

def get_status_by_service(service_name: str):
    return fetch_one("SELECT * FROM status WHERE service_name = ?", (service_name,))

def upsert_status(service_name: str, is_active: bool):
    query = """
        INSERT INTO status (service_name, is_active, last_checked)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(service_name) DO UPDATE SET
            is_active=excluded.is_active,
            last_checked=CURRENT_TIMESTAMP
    """
    execute_query(query, (service_name, int(is_active)))
