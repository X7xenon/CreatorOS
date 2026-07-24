from database.repositories.analytics_repo import get_analytics_by_account

def get_account_analytics(account_id: int):
    return get_analytics_by_account(account_id)
