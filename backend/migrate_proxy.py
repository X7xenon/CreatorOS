"""
One-time migration: add proxy_id column to connected_accounts and create proxies table.
Safe to run multiple times (checks before altering).
"""
import sqlite3

conn = sqlite3.connect("creatoros.db")
cursor = conn.cursor()

# 1. Create proxies table if not exists
cursor.execute("""
CREATE TABLE IF NOT EXISTS proxies (
    id TEXT PRIMARY KEY,
    name TEXT,
    proxy_url_encrypted TEXT NOT NULL,
    proxy_type TEXT DEFAULT 'Datacenter',
    provider TEXT,
    country TEXT,
    sticky_session_id TEXT,
    status TEXT DEFAULT 'ACTIVE',
    last_checked DATETIME,
    last_used DATETIME,
    fail_count INTEGER DEFAULT 0,
    response_time_ms REAL,
    notes TEXT,
    created_at DATETIME
)
""")
print("proxies table: OK")

# 2. Add proxy_id to connected_accounts if missing
cursor.execute("PRAGMA table_info(connected_accounts)")
cols = [row[1] for row in cursor.fetchall()]
print(f"connected_accounts columns: {cols}")

if "proxy_id" not in cols:
    cursor.execute("ALTER TABLE connected_accounts ADD COLUMN proxy_id TEXT REFERENCES proxies(id)")
    print("Added proxy_id column to connected_accounts")
else:
    print("proxy_id column already exists, skipping")

conn.commit()
conn.close()
print("Migration complete!")
