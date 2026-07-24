from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from core.database import get_db
from models.account import CalendarEvent, ConnectedAccount
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter()

class CalendarEventBase(BaseModel):
    account_id: str
    platform: str
    title: str
    status: str
    scheduled_time: datetime
    thumbnail: Optional[str] = None
    color: Optional[str] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    thumbnail: Optional[str] = None
    color: Optional[str] = None

class CalendarEventResponse(CalendarEventBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/events", response_model=List[CalendarEventResponse])
def get_events(
    account_id: Optional[str] = None,
    platform: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CalendarEvent)
    
    if account_id and account_id != 'all':
        query = query.filter(CalendarEvent.account_id == account_id)
        
    if platform:
        query = query.filter(CalendarEvent.platform == platform)
        
    if month:
        query = query.filter(extract('month', CalendarEvent.scheduled_time) == month)
        
    if year:
        query = query.filter(extract('year', CalendarEvent.scheduled_time) == year)
        
    return query.all()

@router.post("/events", response_model=CalendarEventResponse)
def create_event(event: CalendarEventCreate, db: Session = Depends(get_db)):
    # Verify account exists
    account = db.query(ConnectedAccount).filter(ConnectedAccount.id == event.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    db_event = CalendarEvent(
        id=f"cal_{uuid.uuid4().hex[:8]}",
        **event.dict()
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.put("/events/{event_id}", response_model=CalendarEventResponse)
def update_event(event_id: str, event_update: CalendarEventUpdate, db: Session = Depends(get_db)):
    db_event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    update_data = event_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
        
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/events/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db)):
    db_event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
        

