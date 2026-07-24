from sqlalchemy.orm import Session
from models.account import ConnectedAccount, DailySnapshot

class AccountsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_accounts(self):
        return self.db.query(ConnectedAccount).all()

    def get_account(self, account_id: str):
        return self.db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()

    def get_account_snapshots(self, account_id: str, limit: int = 1):
        return self.db.query(DailySnapshot).filter(
            DailySnapshot.account_id == account_id
        ).order_by(DailySnapshot.date.desc()).limit(limit).all()
