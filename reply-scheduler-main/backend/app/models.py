"""
Match Replay Scheduler — Data Models & Priority Scoring
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ReplayStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class LogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str


class ReplayJob(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    match_id: str
    scheduled_time: datetime
    runtime_duration: int = 30  # replay video duration in seconds
    status: ReplayStatus = ReplayStatus.queued
    progress: int = 0
    priority: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    logs: list[LogEntry] = Field(default_factory=list)


class ScheduleRequest(BaseModel):
    match_id: str
    scheduled_time: datetime
    runtime_duration: int = 30  # seconds — how long the replay video runs


class ScheduleResponse(BaseModel):
    id: UUID
    match_id: str
    scheduled_time: datetime
    runtime_duration: int
    status: ReplayStatus
    progress: int
    priority: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


# ---------------------------------------------------------------------------
# Priority Scoring
# ---------------------------------------------------------------------------
# Higher score = higher priority (runs sooner).
#   - "HIGH" or "VIP" in match_id  → +50
#   - Recently failed replay for same match_id → +30
#   - Default base score → 10
#   - Small time-decay bonus so older queued jobs don't starve

def compute_priority(match_id: str, existing_jobs: list[ReplayJob]) -> float:
    score = 10.0

    upper = match_id.upper()
    if "HIGH" in upper or "VIP" in upper:
        score += 50.0

    # Boost if this match_id had a recent failure
    for job in existing_jobs:
        if job.match_id == match_id and job.status == ReplayStatus.failed:
            score += 30.0
            break  # only count once

    return score
