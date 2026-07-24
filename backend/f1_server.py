from fastapi import FastAPI
from api.routes import status, accounts, analytics, ws
from database.connection import init_db
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import uvicorn
import random

app = FastAPI(title="F1 Telemetry Analytics Dashboard API")
scheduler = AsyncIOScheduler()

async def broadcast_telemetry():
    mock_data = {
        "event": "telemetry_update",
        "views": random.randint(100000, 150000),
        "subscribers": random.randint(50000, 50100),
        "revenue": round(random.uniform(200.5, 350.9), 2),
        "message": f"Video reached {random.randint(100, 350)}K views"
    }
    await ws.manager.broadcast(mock_data)

@app.on_event("startup")
def on_startup():
    init_db()
    scheduler.add_job(broadcast_telemetry, 'interval', seconds=2)
    scheduler.start()

@app.on_event("shutdown")
def on_shutdown():
    scheduler.shutdown()

app.include_router(status.router)
app.include_router(accounts.router)
app.include_router(analytics.router)
app.include_router(ws.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the F1 Telemetry Analytics Dashboard API"}

if __name__ == "__main__":
    uvicorn.run("f1_server:app", host="0.0.0.0", port=8888, reload=True)
