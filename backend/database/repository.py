import sqlite3
from typing import List, Dict, Any, Optional
from core.config import settings

def get_connection() -> sqlite3.Connection:
    # Remove 'sqlite:///' prefix for sqlite3 module if present
    db_path = settings.sqlite_url.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enforce WAL mode
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

class BaseRepository:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def select(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query = f"SELECT * FROM {self.table_name}"
        params = []
        if filters:
            conditions = " AND ".join([f"{k} = ?" for k in filters.keys()])
            query += f" WHERE {conditions}"
            params = list(filters.values())
        
        with get_connection() as conn:
            cursor = conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    def insert(self, data: Dict[str, Any]) -> int:
        columns = ", ".join(data.keys())
        placeholders = ", ".join(["?"] * len(data))
        query = f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})"
        
        with get_connection() as conn:
            cursor = conn.execute(query, list(data.values()))
            conn.commit()
            return cursor.lastrowid

    def update(self, id: int, data: Dict[str, Any]) -> None:
        set_clause = ", ".join([f"{k} = ?" for k in data.keys()])
        query = f"UPDATE {self.table_name} SET {set_clause} WHERE id = ?"
        params = list(data.values()) + [id]
        
        with get_connection() as conn:
            conn.execute(query, params)
            conn.commit()

    def delete(self, id: int) -> None:
        query = f"DELETE FROM {self.table_name} WHERE id = ?"
        with get_connection() as conn:
            conn.execute(query, [id])
            conn.commit()
