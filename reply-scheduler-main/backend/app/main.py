"""
Match Replay Scheduler — FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router
from .scheduler import start_scheduler, stop_scheduler
from .database import connect_db, disconnect_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB
    await connect_db()
    logging.getLogger("replay_scheduler").info("Connected to MongoDB Atlas")

    # Start APScheduler on startup
    start_scheduler()
    yield
    # Stop APScheduler on shutdown
    stop_scheduler()
    # Disconnect from MongoDB
    await disconnect_db()
    logging.getLogger("replay_scheduler").info("Disconnected from MongoDB")


app = FastAPI(
    title="Match Replay Scheduler",
    description="Internal QA tool for scheduling and monitoring match replay executions",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow everything for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
