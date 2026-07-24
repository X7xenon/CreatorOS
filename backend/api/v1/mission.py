from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from database.repositories.mission_repo import MissionRepository
from models.schemas import GoalCreate, GoalResponse, AchievementResponse

router = APIRouter()

@router.post("/goals", response_model=GoalResponse)
def create_goal(goal_in: GoalCreate, db: Session = Depends(get_db)):
    repo = MissionRepository(db)
    goal = repo.create_goal(
        account_id=goal_in.account_id,
        title=goal_in.title,
        category=goal_in.category,
        target_metric=goal_in.target_metric,
        target_value=goal_in.target_value,
        deadline=goal_in.deadline
    )
    return goal

@router.get("/goals", response_model=list[GoalResponse])
def get_goals(account_id: str = None, db: Session = Depends(get_db)):
    repo = MissionRepository(db)
    return repo.get_active_goals(account_id)

@router.get("/achievements", response_model=list[AchievementResponse])
def get_achievements(account_id: str = None, db: Session = Depends(get_db)):
    repo = MissionRepository(db)
    return repo.get_achievements(account_id)
