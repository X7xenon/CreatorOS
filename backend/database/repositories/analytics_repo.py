from database.connection import fetch_all

def get_analytics_by_account(account_id: int):
    return fetch_all("SELECT * FROM analytics WHERE account_id = ?", (account_id,))
