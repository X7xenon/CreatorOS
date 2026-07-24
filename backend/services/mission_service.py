from sqlalchemy.orm import Session
from database.repositories.mission_repo import MissionRepository
from database.repositories.accounts_repo import AccountsRepository
from core.event_bus import event_bus

class MissionService:
    PREDEFINED_MILESTONES = [
        {"metric": "followers", "value": 1000, "title": "1K Followers", "description": "Hit 1,000 followers on your account!", "icon": "🥉"},
        {"metric": "followers", "value": 10000, "title": "10K Followers", "description": "Hit 10,000 followers! You're on fire.", "icon": "🥈"},
        {"metric": "followers", "value": 100000, "title": "100K Followers", "description": "Hit 100,000 followers! Silver Play Button incoming.", "icon": "🥇"},
        {"metric": "views", "value": 10000, "title": "10K Views", "description": "Reached 10,000 total views.", "icon": "👁️"},
        {"metric": "views", "value": 1000000, "title": "1 Million Views!", "description": "A million eyeballs on your content.", "icon": "🤯"},
        {"metric": "uploads", "value": 1, "title": "First Upload", "description": "You published your first piece of content!", "icon": "🚀"},
        {"metric": "uploads", "value": 10, "title": "10 Uploads", "description": "Consistency is key. 10 videos down.", "icon": "🎬"},
        {"metric": "uploads", "value": 100, "title": "100 Uploads", "description": "You are a content machine.", "icon": "🔥"},
    ]

    def __init__(self, db: Session):
        self.db = db
        self.repo = MissionRepository(db)
        self.accounts_repo = AccountsRepository(db)

    async def evaluate_milestones(self, account_id: str):
        # Fetch current metrics
        account = self.accounts_repo.get_account(account_id)
        if not account:
            return

        # Simple aggregation (In a real app, you'd fetch from Analytics repo, but for now we look at snapshots)
        latest_snapshot = self.accounts_repo.get_account_snapshots(account_id)
        if not latest_snapshot:
            return
            
        latest = latest_snapshot[0]
        current_stats = {
            "followers": latest.followers_count,
            "views": sum(m.views for m in account.media) if account.media else 0,
            "uploads": latest.total_posts
        }

        # Check Predefined Milestones
        for ms in self.PREDEFINED_MILESTONES:
            metric = ms["metric"]
            target = ms["value"]
            if current_stats.get(metric, 0) >= target:
                ach, is_new = self.repo.unlock_achievement(
                    account_id, ms["title"], ms["description"], ms["icon"]
                )
                if is_new:
                    await event_bus.publish("mission_event", {
                        "type": "ACHIEVEMENT_UNLOCKED",
                        "title": ms["title"],
                        "account_id": account_id
                    })

    async def update_goals_progress(self, account_id: str):
        account = self.accounts_repo.get_account(account_id)
        if not account:
            return

        latest_snapshot = self.accounts_repo.get_account_snapshots(account_id)
        if not latest_snapshot:
            return
            
        latest = latest_snapshot[0]
        current_stats = {
            "Followers": latest.followers_count,
            "Views": sum(m.views for m in account.media) if account.media else 0,
            "Uploads": latest.total_posts
        }

        goals = self.repo.get_active_goals(account_id)
        for goal in goals:
            metric = goal.target_metric # e.g. "Followers"
            if metric in current_stats:
                new_val = current_stats[metric]
                if new_val != goal.current_value:
                    self.repo.update_goal_progress(goal.id, new_val)
                    if new_val >= goal.target_value:
                        await event_bus.publish("mission_event", {
                            "type": "GOAL_COMPLETED",
                            "title": goal.title,
                            "account_id": account_id
                        })
