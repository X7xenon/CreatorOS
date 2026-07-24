from typing import List, Dict, Any
from database.repository import BaseRepository

class AnalyticsRepository(BaseRepository):
    def __init__(self):
        super().__init__("analytics_metrics")
        
    def setup_table(self):
        from database.repository import get_connection
        with get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analytics_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER,
                    metric_name TEXT,
                    value REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS content_performance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER,
                    title TEXT,
                    views INTEGER,
                    revenue REAL
                )
            """)
            conn.commit()

    def get_metrics_by_account_ids(self, account_ids: List[int]) -> List[Dict[str, Any]]:
        if not account_ids:
            return []
        placeholders = ",".join(["?"] * len(account_ids))
        query = f"SELECT account_id, metric_name, SUM(value) as total_value FROM {self.table_name} WHERE account_id IN ({placeholders}) GROUP BY account_id, metric_name"
        from database.repository import get_connection
        with get_connection() as conn:
            cursor = conn.execute(query, account_ids)
            return [dict(row) for row in cursor.fetchall()]

    def get_top_content_by_account_ids(self, account_ids: List[int]) -> List[Dict[str, Any]]:
        if not account_ids:
            return []
        placeholders = ",".join(["?"] * len(account_ids))
        query = f"SELECT * FROM content_performance WHERE account_id IN ({placeholders}) ORDER BY views DESC"
        from database.repository import get_connection
        with get_connection() as conn:
            cursor = conn.execute(query, account_ids)
            return [dict(row) for row in cursor.fetchall()]

class AnalyticsService:
    def __init__(self, repository: AnalyticsRepository):
        self.repository = repository
        self.repository.setup_table()
        # Seed some data if empty
        if not self.repository.select():
            # Account 1 metrics
            self.repository.insert({"account_id": 1, "metric_name": "views", "value": 2500000})
            self.repository.insert({"account_id": 1, "metric_name": "subs", "value": 50000})
            self.repository.insert({"account_id": 1, "metric_name": "revenue", "value": 12000.0})
            # Account 2 metrics
            self.repository.insert({"account_id": 2, "metric_name": "views", "value": 1800000})
            self.repository.insert({"account_id": 2, "metric_name": "subs", "value": 35000})
            self.repository.insert({"account_id": 2, "metric_name": "revenue", "value": 8500.0})
            
            # Top content
            from database.repository import get_connection
            with get_connection() as conn:
                conn.execute("INSERT INTO content_performance (account_id, title, views, revenue) VALUES (1, 'How to code in Python', 1500000, 8000)")
                conn.execute("INSERT INTO content_performance (account_id, title, views, revenue) VALUES (2, 'Beer Review 2026', 900000, 4000)")
                conn.commit()

    def get_dashboard_summary(self) -> Dict[str, Any]:
        metrics = self.repository.select()
        return {
            "total_views": sum(m["value"] for m in metrics if m["metric_name"] == "views"),
            "total_likes": sum(m["value"] for m in metrics if m["metric_name"] == "likes"),
            "raw_metrics": metrics
        }
        
    def get_comparison_data(self, account_ids: List[int]) -> Dict[int, Any]:
        metrics = self.repository.get_metrics_by_account_ids(account_ids)
        content = self.repository.get_top_content_by_account_ids(account_ids)
        
        result = {}
        for aid in account_ids:
            result[aid] = {
                "metrics": {m["metric_name"]: m["total_value"] for m in metrics if m["account_id"] == aid},
                "top_content": [c for c in content if c["account_id"] == aid]
            }
        return result
