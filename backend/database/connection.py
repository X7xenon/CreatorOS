import sqlite3
import contextlib
import os

DATABASE_URL = os.getenv("DATABASE_URL", "f1_telemetry.db")

def get_connection():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

@contextlib.contextmanager
def get_db_cursor():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def execute_query(query: str, params: tuple = ()):
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        return cursor.rowcount

def fetch_all(query: str, params: tuple = ()):
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]

def fetch_one(query: str, params: tuple = ()):
    with get_db_cursor() as cursor:
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

def init_db():
    with get_db_cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                service_name TEXT UNIQUE NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                race_name TEXT NOT NULL,
                lap_time REAL NOT NULL,
                top_speed REAL NOT NULL,
                FOREIGN KEY(account_id) REFERENCES accounts(id)
            )
        """)
        
        cursor.execute("SELECT count(*) FROM accounts")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO accounts (username, email) VALUES ('hamilton44', 'lewis@mercedes.com')")
            cursor.execute("INSERT INTO accounts (username, email) VALUES ('max33', 'max@redbull.com')")
            
            cursor.execute("INSERT INTO analytics (account_id, race_name, lap_time, top_speed) VALUES (1, 'Silverstone', 87.32, 320.5)")
            cursor.execute("INSERT INTO analytics (account_id, race_name, lap_time, top_speed) VALUES (1, 'Monaco', 72.15, 290.1)")
            cursor.execute("INSERT INTO analytics (account_id, race_name, lap_time, top_speed) VALUES (2, 'Spa', 105.42, 340.2)")

