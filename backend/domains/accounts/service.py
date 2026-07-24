from typing import List, Dict, Any, Optional
from database.repository import BaseRepository

class AccountsRepository(BaseRepository):
    def __init__(self):
        super().__init__("accounts")
        
    def setup_table(self):
        from database.repository import get_connection
        with get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    platform TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            
    def get_by_usernames(self, usernames: List[str]) -> List[Dict[str, Any]]:
        if not usernames:
            return []
        
        placeholders = ",".join(["?"] * len(usernames))
        query = f"SELECT * FROM {self.table_name} WHERE username IN ({placeholders})"
        
        from database.repository import get_connection
        with get_connection() as conn:
            cursor = conn.execute(query, usernames)
            return [dict(row) for row in cursor.fetchall()]

class AccountsService:
    def __init__(self, repository: AccountsRepository):
        self.repository = repository
        self.repository.setup_table()
        # Seed
        if not self.repository.select():
            self.repository.insert({"username": "xenon_iit", "platform": "youtube"})
            self.repository.insert({"username": "theabeerexperience", "platform": "youtube"})
            
    def get_accounts_by_usernames(self, usernames: List[str]) -> List[Dict[str, Any]]:
        return self.repository.get_by_usernames(usernames)
