"""
Match Replay Scheduler — REST API Routes
"""

from datetime import datetime, timedelta, timezone
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, HTTPException

from .models import ReplayStatus, ScheduleRequest, ScheduleResponse
from .scheduler import add_job, cancel_job, get_all_jobs, get_history_jobs, get_job, get_job_logs, reschedule_job
from .database import get_db

router = APIRouter(prefix="/replays", tags=["replays"])


def _to_response(j) -> ScheduleResponse:
    return ScheduleResponse(
        id=j.id,
        match_id=j.match_id,
        scheduled_time=j.scheduled_time,
        runtime_duration=j.runtime_duration,
        status=j.status,
        progress=j.progress,
        priority=j.priority,
        created_at=j.created_at,
        completed_at=j.completed_at,
        error_message=j.error_message,
    )


# ---------------------------------------------------------------------------
# POST /replays/schedule
# ---------------------------------------------------------------------------
@router.post("/schedule", response_model=ScheduleResponse, status_code=201)
async def schedule_replay(req: ScheduleRequest):
    if not req.match_id or not req.match_id.strip():
        raise HTTPException(status_code=400, detail="match_id cannot be empty")

    scheduled = req.scheduled_time
    # Compare using local time (frontend sends local datetime-local values)
    if scheduled.tzinfo is None:
        if scheduled <= datetime.now():
            raise HTTPException(status_code=400, detail="scheduled_time must be in the future")
    else:
        if scheduled <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="scheduled_time must be in the future")

    job = await add_job(req.match_id.strip(), scheduled, req.runtime_duration)
    return _to_response(job)


# ---------------------------------------------------------------------------
# GET /replays  — active queue (queued + running)
# ---------------------------------------------------------------------------
@router.get("/")
async def list_replays():
    return [_to_response(j) for j in await get_all_jobs()]


# ---------------------------------------------------------------------------
# GET /replays/history  — finished replays (completed / failed / cancelled)
# ---------------------------------------------------------------------------
@router.get("/history")
async def list_history():
    return [_to_response(j) for j in await get_history_jobs()]


# ---------------------------------------------------------------------------
# GET /replays/analytics  — heatmap + trend data for charts
# ---------------------------------------------------------------------------
@router.get("/analytics")
async def get_analytics():
    db = get_db()

    # Gather all jobs from both collections
    all_jobs = []
    from .scheduler import _doc_to_job
    async for doc in db.replay_jobs.find():
        all_jobs.append(_doc_to_job(doc))
    async for doc in db.replay_history.find():
        all_jobs.append(_doc_to_job(doc))

    # --- Heatmap: on-time completion rate by day-of-week × hour ---
    slot_total: dict[tuple[int, int], int] = defaultdict(int)
    slot_ontime: dict[tuple[int, int], int] = defaultdict(int)

    for job in all_jobs:
        if job.status != ReplayStatus.completed:
            continue
        sched = job.scheduled_time
        if sched.tzinfo is None:
            sched = sched.replace(tzinfo=timezone.utc)
        day = sched.weekday()  # 0=Mon … 6=Sun
        hour = sched.hour
        slot_total[(day, hour)] += 1

        if job.completed_at:
            completed = job.completed_at
            if completed.tzinfo is None:
                completed = completed.replace(tzinfo=timezone.utc)
            expected_end = sched + timedelta(seconds=job.runtime_duration * 1.2)
            if completed <= expected_end:
                slot_ontime[(day, hour)] += 1

    heatmap = []
    for (day, hour), total in slot_total.items():
        ontime = slot_ontime.get((day, hour), 0)
        heatmap.append({
            "day": day,
            "hour": hour,
            "total": total,
            "on_time": ontime,
            "rate": round(ontime / total * 100, 1) if total > 0 else 0,
        })

    # --- Trend: daily scheduled_count vs completed_count ---
    day_scheduled: dict[str, int] = defaultdict(int)
    day_completed: dict[str, int] = defaultdict(int)

    for job in all_jobs:
        date_str = job.created_at.strftime("%Y-%m-%d")
        day_scheduled[date_str] += 1
        if job.status == ReplayStatus.completed and job.completed_at:
            comp_date = job.completed_at.strftime("%Y-%m-%d")
            day_completed[comp_date] += 1

    all_dates = sorted(set(list(day_scheduled.keys()) + list(day_completed.keys())))
    trend = [
        {
            "date": d,
            "scheduled": day_scheduled.get(d, 0),
            "completed": day_completed.get(d, 0),
        }
        for d in all_dates
    ]

    return {"heatmap": heatmap, "trend": trend}


# ---------------------------------------------------------------------------
# GET /replays/{id}
# ---------------------------------------------------------------------------
@router.get("/{job_id}")
async def get_replay(job_id: UUID):
    job = await get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return _to_response(job)


# ---------------------------------------------------------------------------
# DELETE /replays/{id}
# ---------------------------------------------------------------------------
@router.delete("/{job_id}")
async def delete_replay(job_id: UUID):
    try:
        job = await cancel_job(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"detail": "Job cancelled", "id": str(job.id)}


# ---------------------------------------------------------------------------
# POST /replays/{id}/reschedule
# ---------------------------------------------------------------------------
@router.post("/{job_id}/reschedule", response_model=ScheduleResponse)
async def api_reschedule_job(job_id: UUID):
    try:
        # Reschedule for 10 seconds in the future
        new_time = datetime.now(timezone.utc) + timedelta(seconds=10)
        job = await reschedule_job(job_id, new_time)
        return _to_response(job)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ---------------------------------------------------------------------------
# GET /replays/{id}/logs
# ---------------------------------------------------------------------------
@router.get("/{job_id}/logs")
async def get_logs(job_id: UUID):
    try:
        logs = await get_job_logs(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return [{"timestamp": entry.timestamp.isoformat(), "message": entry.message} for entry in logs]
