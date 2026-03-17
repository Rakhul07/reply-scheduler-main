"""
Match Replay Scheduler — Background Worker & Queue Manager (APScheduler + MongoDB)

Queue data is stored in **MongoDB Atlas**:
  - collection `replay_jobs`    → active queue (queued + running)
  - collection `replay_history` → completed / failed / cancelled replays
State persists across server restarts.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone
from uuid import UUID, uuid4

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .models import LogEntry, ReplayJob, ReplayStatus, compute_priority
from .database import get_db

logger = logging.getLogger("replay_scheduler")

# ---------------------------------------------------------------------------
# Concurrency
# ---------------------------------------------------------------------------
lock = asyncio.Lock()
MAX_CONCURRENT = 5

# In-memory cache for running jobs (needed for real-time progress tracking)
# Only running jobs live here; queued jobs are fetched from DB on demand.
_running_jobs: dict[str, ReplayJob] = {}

# APScheduler instance
scheduler = AsyncIOScheduler()


# ---------------------------------------------------------------------------
# Helpers — serialize / deserialize between Pydantic and MongoDB
# ---------------------------------------------------------------------------
def _job_to_doc(job: ReplayJob) -> dict:
    """Convert a ReplayJob to a MongoDB document."""
    d = job.model_dump()
    d["_id"] = str(d.pop("id"))  # use string UUID as _id
    d["status"] = d["status"].value if hasattr(d["status"], "value") else d["status"]
    d["logs"] = [
        {"timestamp": log["timestamp"].isoformat() if isinstance(log["timestamp"], datetime) else log["timestamp"],
         "message": log["message"]}
        for log in d.get("logs", [])
    ]
    # Convert datetimes
    for key in ("scheduled_time", "created_at", "completed_at"):
        if d.get(key) and isinstance(d[key], datetime):
            d[key] = d[key]
    return d


def _doc_to_job(doc: dict) -> ReplayJob:
    """Convert a MongoDB document back to a ReplayJob."""
    doc["id"] = doc.pop("_id")
    doc["logs"] = [
        LogEntry(timestamp=log["timestamp"], message=log["message"])
        for log in doc.get("logs", [])
    ]
    return ReplayJob(**doc)


async def _save_job_to_db(job: ReplayJob, collection: str = "replay_jobs"):
    """Upsert a job into the specified collection."""
    db = get_db()
    doc = _job_to_doc(job)
    await db[collection].replace_one({"_id": doc["_id"]}, doc, upsert=True)


async def _move_to_history(job: ReplayJob) -> None:
    """Move a finished job from active queue to history. Must be called under lock."""
    db = get_db()
    job_id_str = str(job.id)

    # Remove from active queue
    await db.replay_jobs.delete_one({"_id": job_id_str})
    _running_jobs.pop(job_id_str, None)

    # Insert into history
    await _save_job_to_db(job, "replay_history")
    logger.info("Job %s moved to history (status=%s)", job.id, job.status.value)


# ---------------------------------------------------------------------------
# Public helpers (called by routes)
# ---------------------------------------------------------------------------
async def add_job(match_id: str, scheduled_time: datetime, runtime_duration: int = 30) -> ReplayJob:
    db = get_db()

    # Get all existing jobs for priority computation
    all_docs = []
    async for doc in db.replay_jobs.find():
        all_docs.append(_doc_to_job(doc))
    async for doc in db.replay_history.find():
        all_docs.append(_doc_to_job(doc))

    priority = compute_priority(match_id, all_docs)
    job = ReplayJob(
        match_id=match_id,
        scheduled_time=scheduled_time,
        runtime_duration=max(runtime_duration, 5),
        priority=priority,
    )
    job.logs.append(LogEntry(message=f"Job created — match {match_id} scheduled for {scheduled_time.isoformat()} (runtime: {job.runtime_duration}s)"))

    await _save_job_to_db(job, "replay_jobs")
    logger.info("Job %s created for match %s (priority=%.1f, runtime=%ds)", job.id, match_id, priority, job.runtime_duration)
    return job


async def reschedule_job(job_id: UUID, new_scheduled_time: datetime) -> ReplayJob:
    db = get_db()
    job_id_str = str(job_id)
    doc = await db.replay_history.find_one({"_id": job_id_str})
    if doc is None:
        raise ValueError("Job not found in history")

    job = _doc_to_job(doc)
    if job.status != ReplayStatus.failed:
        raise ValueError(f"Cannot reschedule job with status '{job.status.value}'. Only failed jobs can be rescheduled.")

    # Reset state
    job.status = ReplayStatus.queued
    job.progress = 0
    job.error_message = None
    job.completed_at = None
    job.scheduled_time = new_scheduled_time

    # If manually rescheduled, convert match_id to uppercase so it succeeds this time
    if job.match_id.islower():
        job.match_id = job.match_id.upper()

    # Re-compute priority
    all_docs = []
    async for d in db.replay_jobs.find():
        all_docs.append(_doc_to_job(d))
    async for d in db.replay_history.find():
        all_docs.append(_doc_to_job(d))
    job.priority = compute_priority(job.match_id, all_docs)

    job.logs.append(LogEntry(message=f"Job manually rescheduled for {new_scheduled_time.isoformat()}"))

    # Move from history back to active queue
    await db.replay_history.delete_one({"_id": job_id_str})
    await _save_job_to_db(job, "replay_jobs")

    logger.info("Job %s rescheduled for match %s (new priority=%.1f)", job.id, job.match_id, job.priority)
    return job


async def cancel_job(job_id: UUID) -> ReplayJob:
    db = get_db()
    job_id_str = str(job_id)

    # Check in-memory running jobs first
    async with lock:
        if job_id_str in _running_jobs:
            job = _running_jobs[job_id_str]
            if job.status != ReplayStatus.queued:
                raise ValueError(f"Cannot cancel job with status '{job.status.value}'. Only queued jobs can be cancelled.")

    # Check in DB
    doc = await db.replay_jobs.find_one({"_id": job_id_str})
    if doc is None:
        raise ValueError("Job not found")

    job = _doc_to_job(doc)
    if job.status != ReplayStatus.queued:
        raise ValueError(f"Cannot cancel job with status '{job.status.value}'. Only queued jobs can be cancelled.")

    job.status = ReplayStatus.cancelled
    job.progress = 0
    job.completed_at = datetime.now(timezone.utc)
    job.logs.append(LogEntry(message="Job cancelled by user"))

    await _move_to_history(job)
    logger.info("Job %s cancelled and moved to history", job_id)
    return job


async def get_all_jobs() -> list[ReplayJob]:
    """Return active queue (queued + running ONLY) sorted by created_at desc."""
    db = get_db()
    result = []

    # Only fetch jobs that are queued or running from the DB
    query = {"status": {"$in": ["queued", "running"]}}
    async for doc in db.replay_jobs.find(query).sort("created_at", -1):
        job_id = doc["_id"]
        async with lock:
            if job_id in _running_jobs:
                # Use the in-memory version (has real-time progress)
                job = _running_jobs[job_id]
                # Only include if still active
                if job.status in (ReplayStatus.queued, ReplayStatus.running):
                    result.append(job)
            else:
                result.append(_doc_to_job(doc))

    return result


async def get_history_jobs() -> list[ReplayJob]:
    """Return finished jobs (completed / failed / cancelled) sorted by created_at desc."""
    db = get_db()
    result = []
    async for doc in db.replay_history.find().sort("created_at", -1):
        result.append(_doc_to_job(doc))
    return result


async def get_job(job_id: UUID) -> ReplayJob | None:
    """Look up a job in both active queue and history."""
    db = get_db()
    job_id_str = str(job_id)

    # Check in-memory running jobs first
    async with lock:
        if job_id_str in _running_jobs:
            return _running_jobs[job_id_str]

    doc = await db.replay_jobs.find_one({"_id": job_id_str})
    if doc:
        return _doc_to_job(doc)

    doc = await db.replay_history.find_one({"_id": job_id_str})
    if doc:
        return _doc_to_job(doc)

    return None


async def get_job_logs(job_id: UUID) -> list[LogEntry]:
    job = await get_job(job_id)
    if job is None:
        raise ValueError("Job not found")
    return list(job.logs)


# ---------------------------------------------------------------------------
# Replay simulation worker
# ---------------------------------------------------------------------------
async def _run_replay(job: ReplayJob) -> None:
    """
    Replay execution flow:
      1. WAIT for scheduled_time — progress goes from 0 → 90 %
      2. EXECUTE replay after scheduled_time — progress goes from 0 → 100 %
      3. Move to history on completion / failure
    """
    job_id_str = str(job.id)

    # Track this job in memory for real-time progress
    async with lock:
        _running_jobs[job_id_str] = job

    # --- Phase 1: Wait until scheduled_time, updating progress ---
    sched = job.scheduled_time
    # Strip tzinfo for consistent naive-local comparison
    if sched.tzinfo is not None:
        sched = sched.replace(tzinfo=None)

    created = job.created_at
    if created.tzinfo is not None:
        created = created.replace(tzinfo=None)

    total_wait = (sched - created).total_seconds()

    job.logs.append(LogEntry(message=f"Waiting until {sched.isoformat()} to start replay"))
    logger.info("Job %s waiting until %s (%.0fs)", job.id, sched.isoformat(), max(total_wait, 0))

    while True:
        now = datetime.now()

        # Check if cancelled while waiting
        db = get_db()
        doc = await db.replay_jobs.find_one({"_id": job_id_str})
        if doc is None:
            # Job was cancelled/deleted externally
            async with lock:
                _running_jobs.pop(job_id_str, None)
            return

        if now >= sched:
            break

        # Update progress proportionally (0% → 90% during wait)
        elapsed = (now - created).total_seconds()
        if total_wait > 0:
            wait_progress = min(int((elapsed / total_wait) * 90), 89)
        else:
            wait_progress = 89

        job.progress = wait_progress
        await asyncio.sleep(2)

    # --- Phase 2: Execute replay — progress 0 → 100 % over runtime_duration ---
    duration = job.runtime_duration
    job.status = ReplayStatus.running
    job.progress = 0
    job.logs.append(LogEntry(message=f"Scheduled time reached — replaying ({duration}s runtime)"))

    # Update DB status to running
    await _save_job_to_db(job, "replay_jobs")
    logger.info("Job %s executing (match %s, %ds)", job.id, job.match_id, duration)

    # If match_id is entirely lowercase, it ALWAYS fails. Otherwise, it NEVER fails.
    should_fail = job.match_id.islower()
    fail_at_pct = random.randint(20, 85) if should_fail else None

    start_time = datetime.now(timezone.utc)
    update_interval = max(duration / 100, 0.5)

    while True:
        await asyncio.sleep(update_interval)

        elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
        pct = min(int((elapsed / duration) * 100), 100)

        # Check if cancelled during replay
        db = get_db()
        doc = await db.replay_jobs.find_one({"_id": job_id_str})
        if doc is None:
            async with lock:
                _running_jobs.pop(job_id_str, None)
            return

        job.progress = pct

        # Log every 10%
        if pct % 10 == 0 and pct > 0:
            job.logs.append(LogEntry(message=f"Replaying: {pct}% ({elapsed:.0f}s / {duration}s)"))

        if fail_at_pct and pct >= fail_at_pct:
            job.status = ReplayStatus.failed
            job.completed_at = datetime.now(timezone.utc)
            job.error_message = f"Replay failed at {pct}% ({elapsed:.0f}s)"
            job.logs.append(LogEntry(message=f"FAILURE — {job.error_message}"))
            logger.warning("Job %s FAILED at %d%%", job.id, pct)
            await _move_to_history(job)
            return

        if pct >= 100:
            break

    job.status = ReplayStatus.completed
    job.progress = 100
    job.completed_at = datetime.now(timezone.utc)
    job.logs.append(LogEntry(message=f"Replay completed ({duration}s)"))
    await _move_to_history(job)
    logger.info("Job %s completed (match %s)", job.id, job.match_id)


# ---------------------------------------------------------------------------
# APScheduler job — dispatches queued → running
# ---------------------------------------------------------------------------
async def dispatch_queued_jobs() -> None:
    """Check for queued jobs whose time is approaching and start workers."""
    try:
        db = get_db()
        if db is None:
            return

        async with lock:
            running_count = len(_running_jobs)
            available_slots = MAX_CONCURRENT - running_count

        if available_slots > 0:
            cursor = db.replay_jobs.find({"status": "queued"}).sort("priority", -1).limit(available_slots)
            async for doc in cursor:
                job = _doc_to_job(doc)

                # Check it's not already being processed
                job_id_str = str(job.id)
                async with lock:
                    if job_id_str in _running_jobs:
                        continue
                    _running_jobs[job_id_str] = job

                job.logs.append(LogEntry(message="Picked up by scheduler"))
                asyncio.create_task(_run_replay(job))
                logger.info("Scheduler dispatched job %s (priority=%.1f)", job.id, job.priority)
    except Exception as exc:
        logger.error("Scheduler dispatch error: %s", exc)


def start_scheduler() -> None:
    scheduler.add_job(
        dispatch_queued_jobs,
        trigger="interval",
        seconds=2,
        id="replay_dispatcher",
        name="Replay Queue Dispatcher",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — dispatching every 2s (max %d concurrent)", MAX_CONCURRENT)


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped")
