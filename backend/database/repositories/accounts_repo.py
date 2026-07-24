from database.connection import fetch_all, fetch_one

def get_all_accounts():
    return fetch_all("SELECT * FROM accounts")

def get_account_by_id(account_id: int):
    return fetch_one("SELECT * FROM accounts WHERE id = ?", (account_id,))
