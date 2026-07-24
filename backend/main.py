from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.dashboard import router as dashboard_router
from core.websocket.router import router as websocket_router
from api.v1.comparison import router as comparison_router
from api.v1.auth import router as auth_router
from core.database import engine, Base
from core.scheduler import start_scheduler, stop_scheduler

# Create database tables
Base.metadata.create_all(bind=engine)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(
    title="CreatorOS Analytics API",
    description="Backend API for CreatorOS Analytics Dashboard",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

from api.v1.calendar import router as calendar_router
from api.v1.whatsapp import router as whatsapp_router

app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(websocket_router, prefix="/api/v1/ws", tags=["websocket"])
app.include_router(comparison_router, prefix="/api/v1/comparison", tags=["comparison"])
app.include_router(calendar_router, prefix="/api/v1/calendar", tags=["calendar"])
app.include_router(whatsapp_router, prefix="/api/v1/whatsapp", tags=["whatsapp"])
