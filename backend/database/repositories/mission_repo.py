from typing import List, Optional
from sqlalchemy.orm import Session
from models.account import Goal, Achievement, GoalProgress
import uuid
from datetime import datetime

class MissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_goal(self, account_id: str, title: str, category: str, target_metric: str, target_value: int, deadline: Optional[datetime] = None) -> Goal:
        goal = Goal(
            id=str(uuid.uuid4()),
            account_id=account_id,
            title=title,
            category=category,
            target_metric=target_metric,
            target_value=target_value,
            deadline=deadline
        )
        self.db.add(goal)
        self.db.commit()
        self.db.refresh(goal)
        return goal

    def get_active_goals(self, account_id: Optional[str] = None) -> List[Goal]:
        query = self.db.query(Goal).filter(Goal.status == "IN_PROGRESS")
        if account_id:
            query = query.filter(Goal.account_id == account_id)
        return query.all()

    def update_goal_progress(self, goal_id: str, new_value: int):
        goal = self.db.query(Goal).filter(Goal.id == goal_id).first()
        if goal:
            goal.current_value = new_value
            if goal.current_value >= goal.target_value:
                goal.current_value = goal.target_value
                goal.status = "COMPLETED"
            
            # Record progress
            progress = GoalProgress(goal_id=goal_id, value=new_value)
            self.db.add(progress)
            self.db.commit()
            self.db.refresh(goal)
        return goal

    def unlock_achievement(self, account_id: str, title: str, description: str, icon: str):
        # Check if already unlocked
        existing = self.db.query(Achievement).filter(
            Achievement.account_id == account_id,
            Achievement.title == title
        ).first()
        
        if existing:
            return existing, False
            
        achievement = Achievement(
            id=str(uuid.uuid4()),
            account_id=account_id,
            title=title,
            description=description,
            icon=icon
        )
        self.db.add(achievement)
        self.db.commit()
        self.db.refresh(achievement)
        return achievement, True

    def get_achievements(self, account_id: Optional[str] = None) -> List[Achievement]:
        query = self.db.query(Achievement)
        if account_id:
            query = query.filter(Achievement.account_id == account_id)
        return query.order_by(Achievement.unlocked_at.desc()).all()
