# 🎮 Match Replay Scheduler

> **Internal QA Tool** for scheduling, prioritizing, and monitoring match replay executions with persistent MongoDB storage and real-time analytics.

Built with **React 19 + Vite + TailwindCSS** (frontend) and **FastAPI + APScheduler + MongoDB Atlas** (backend).

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Data Models](#-data-models)
- [API Reference](#-api-reference)
- [Priority System](#-priority-system)
- [Failure Simulation & Reschedule](#-failure-simulation--reschedule)
- [Analytics](#-analytics)
- [Setup & Installation](#-setup--installation)
- [Configuration](#-configuration)
- [How It Works](#-how-it-works)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Schedule Replays** | Queue match replays with specific date/time and configurable video runtime (5–3600s) |
| **Smart Priority Queue** | VIP/HIGH matches get +50 priority; previously failed matches get +30 on reschedule |
| **Up to 5 Concurrent Workers** | APScheduler dispatches up to 5 replay workers simultaneously |
| **Real-Time Progress** | Animated progress bars update every 5 seconds via polling |
| **Cancel Jobs** | One-click cancellation for queued jobs |
| **Reschedule Failed Jobs** | One-click retry that auto-converts match ID to uppercase and boosts priority |
| **Execution Logs** | Timestamped logs for every stage — creation, waiting, progress %, completion/failure |
| **Replay History** | Separate table for completed, failed, and cancelled jobs |
| **Analytics Dashboard** | On-time completion heatmap + scheduled vs completed trend chart |
| **Persistent Storage** | MongoDB Atlas — data survives server restarts |
| **Light Theme UI** | Clean, modern light design with violet/indigo accents |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ReplayForm│ │ReplayTable│ │HistoryTbl│ │Analytics    │ │
│  │ Schedule │ │  Queue   │ │ History  │ │Heatmap+Trend│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬──────┘ │
│       │ POST       │ GET        │ GET           │ GET    │
│       │ /schedule  │ /replays/  │ /history      │/analytics│
└───────┼────────────┼────────────┼───────────────┼────────┘
        │            │            │               │
   ─────┴────────────┴────────────┴───────────────┴─────
                    HTTP (polling every 5s)
   ─────────────────────────────────────────────────────
        │
┌───────┴──────────────────────────────────────────────────┐
│                  BACKEND (FastAPI + Python)               │
│                                                          │
│  ┌──────────┐     ┌─────────────┐     ┌───────────────┐ │
│  │ routes.py│────▶│ scheduler.py│────▶│  database.py  │ │
│  │ 7 REST   │     │ APScheduler │     │  Motor client │ │
│  │ endpoints│     │ every 2s    │     │  MongoDB Atlas│ │
│  └──────────┘     │ max 5 conc. │     └───────┬───────┘ │
│                   └──────┬──────┘             │         │
│                          │                     │         │
│               ┌──────────┴──────────┐          │         │
│               │   Async Workers     │          │         │
│               │  _run_replay()      │──────────┘         │
│               │  Phase 1: Wait      │   save progress    │
│               │  Phase 2: Execute   │   move to history  │
│               └─────────────────────┘                    │
└──────────────────────────────────────────────────────────┘
        │
┌───────┴──────────────────────────────────────────────────┐
│              MongoDB Atlas (Cluster0)                     │
│                                                          │
│  ┌────────────────────┐  ┌─────────────────────────────┐ │
│  │ replay_jobs        │  │ replay_history              │ │
│  │ (active queue)     │  │ (completed/failed/cancelled)│ │
│  │ indexes: status,   │  │ indexes: status, created_at,│ │
│  │ priority, created  │  │ match_id                    │ │
│  └────────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI components & state management |
| Vite | Dev server & build tool |
| TailwindCSS | Utility-first styling (light theme) |
| React Router | Client-side routing |
| React Hot Toast | Notification system |
| Recharts | Analytics charts (heatmap, line chart) |

### Backend
| Technology | Purpose |
|-----------|---------|
| FastAPI | REST API framework |
| APScheduler | Background job scheduling (AsyncIOScheduler) |
| Motor | Async MongoDB driver |
| Pydantic | Data validation & serialization |
| Uvicorn | ASGI server |

### Database
| Technology | Purpose |
|-----------|---------|
| MongoDB Atlas | Cloud-hosted persistent storage |
| Collections | `replay_jobs` (active) + `replay_history` (finished) |

---

## 📁 Project Structure

```
reply scheduler/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app entry point + lifespan
│   │   ├── routes.py          # 7 REST API endpoints
│   │   ├── scheduler.py       # APScheduler + replay workers + MongoDB ops
│   │   ├── models.py          # Pydantic models + priority scoring
│   │   └── database.py        # MongoDB connection via Motor
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main layout + routing + stat cards
│   │   ├── api.js             # API client functions
│   │   ├── index.css           # Global styles + Tailwind imports
│   │   └── components/
│   │       ├── ReplayForm.jsx          # Schedule form
│   │       ├── ReplayTable.jsx         # Active queue table
│   │       ├── HistoryTable.jsx        # History table + reschedule button
│   │       ├── ProgressBar.jsx         # Animated progress bar
│   │       ├── OnTimeHeatmap.jsx       # Heatmap analytics chart
│   │       └── ScheduledVsCompletedTrend.jsx  # Trend line chart
│   ├── package.json
│   └── vite.config.js
├── README.md
├── PRESENTATION_GUIDE.md
└── .gitignore
```

---

## 📊 Data Models

### ReplayJob (stored in MongoDB)

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `string (UUID)` | Unique job identifier |
| `match_id` | `string` | Match identifier (e.g., `MATCH_001`, `VIP_GAME_7`) |
| `scheduled_time` | `datetime` | When the replay should start |
| `runtime_duration` | `int` | Video runtime in seconds (5–3600) |
| `status` | `enum` | `queued` \| `running` \| `completed` \| `failed` \| `cancelled` |
| `progress` | `int` | 0–100 percentage |
| `priority` | `float` | Priority score (higher = runs sooner) |
| `created_at` | `datetime` | Job creation timestamp |
| `completed_at` | `datetime?` | Completion/failure/cancellation timestamp |
| `error_message` | `string?` | Failure reason (if failed) |
| `logs` | `LogEntry[]` | Timestamped execution log entries |

### LogEntry

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `datetime` | When the log entry was created |
| `message` | `string` | Log message text |

---

## 🔌 API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/replays/schedule` | Schedule a new replay job |
| `GET` | `/replays/` | Get active queue (queued + running only) |
| `GET` | `/replays/history` | Get finished replays (completed/failed/cancelled) |
| `GET` | `/replays/analytics` | Get heatmap + trend analytics data |
| `GET` | `/replays/{id}` | Get a specific job by ID |
| `DELETE` | `/replays/{id}` | Cancel a queued job |
| `POST` | `/replays/{id}/reschedule` | Reschedule a failed job (10s in the future) |
| `GET` | `/replays/{id}/logs` | Get execution logs for a job |

### POST /replays/schedule — Request Body

```json
{
  "match_id": "MATCH_001",
  "scheduled_time": "2026-03-16T14:30",
  "runtime_duration": 30
}
```

### POST /replays/schedule — Response (201)

```json
{
  "id": "a1b2c3d4-...",
  "match_id": "MATCH_001",
  "scheduled_time": "2026-03-16T14:30:00",
  "runtime_duration": 30,
  "status": "queued",
  "progress": 0,
  "priority": 10.0,
  "created_at": "2026-03-16T14:25:00",
  "completed_at": null,
  "error_message": null
}
```

---

## ⚡ Priority System

Every job receives a priority score. **Higher score = runs first**.

| Condition | Score |
|-----------|-------|
| Base score (all jobs) | **+10** |
| Match ID contains `HIGH` or `VIP` (case-insensitive) | **+50** |
| Same `match_id` previously failed (reschedule bonus) | **+30** |

### Examples

| Match ID | Priority | Why |
|----------|----------|-----|
| `MATCH_001` | 10 | Base only |
| `VIP_MATCH_42` | 60 | Base (10) + VIP bonus (50) |
| `HIGH_PRIORITY_1` | 60 | Base (10) + HIGH bonus (50) |
| `MATCH_001` (rescheduled after failure) | 40 | Base (10) + failure bonus (30) |
| `VIP_MATCH_42` (rescheduled after failure) | 90 | Base (10) + VIP (50) + failure (30) |

### Dispatch Logic

Every **2 seconds**, APScheduler:
1. Counts running jobs
2. Calculates available slots (`MAX_CONCURRENT=5 - running`)
3. Fetches queued jobs, sorted by priority (highest first)
4. Dispatches top N jobs to fill available slots

---

## 🔄 Failure Simulation & Reschedule

### How Failures Work
- **Lowercase match IDs** (e.g., `test_match`, `small_game`) → **always fail** at a random progress point (20–85%)
- **Uppercase/mixed match IDs** (e.g., `MATCH_001`, `VIP_Game`) → **always succeed**

### Reschedule Flow
1. A job with match ID `test_match` runs and **fails** at ~45%
2. It moves to **Replay History** with a red "Failed" badge
3. User clicks the **Reschedule** button
4. Backend automatically:
   - Converts `test_match` → `TEST_MATCH` (uppercase)
   - Resets status to `queued`, progress to 0
   - Adds +30 priority bonus for the failure history
   - Schedules it for 10 seconds in the future
5. Job re-enters the **Replay Queue** and **succeeds** this time (uppercase = success)

This creates a perfect demo cycle: **schedule → fail → reschedule → succeed**.

---

## 📈 Analytics

### On-Time Completion Heatmap
- Grid showing completion rate by **day-of-week × hour**
- "On-time" = completed within 120% of the expected duration
- Helps identify peak reliability windows and problematic time slots

### Scheduled vs Completed Trend
- Daily line chart comparing **scheduled count** vs **completed count**
- A growing gap between the two lines signals a **backlog** problem
- Uses Recharts library for interactive, responsive charts

---

## 🚀 Setup & Installation

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **MongoDB Atlas** account (or local MongoDB instance)

### 1. Clone the repository

```bash
git clone <repo-url>
cd "reply scheduler"
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to `http://localhost:5173/tools/replay-scheduler`

---

## ⚙ Configuration

### MongoDB Connection
The MongoDB URI is configured in `backend/app/database.py`:

```python
MONGO_URI = "mongodb+srv://<username>:<password>@cluster0.gtmcgsk.mongodb.net/?appName=Cluster0"
DB_NAME = "replay_scheduler"
```

### Backend Settings
| Setting | Location | Default |
|---------|----------|---------|
| `MAX_CONCURRENT` | `scheduler.py` | `5` |
| Dispatch interval | `scheduler.py` | `2 seconds` |
| CORS origins | `main.py` | `["*"]` (dev only) |

### Frontend Settings
| Setting | Location | Default |
|---------|----------|---------|
| API base URL | `api.js` | `http://localhost:8000` |
| Poll interval | `App.jsx` | `5000ms` |

---

## 🔧 How It Works

### Job Lifecycle

```
           ┌─────────┐
           │ CREATED  │ ← User submits the form
           └────┬─────┘
                │ add to replay_jobs collection
                ▼
           ┌─────────┐
           │ QUEUED   │ ← Waiting for scheduler dispatch
           │ 0–89%   │   (progress = wait time proportion)
           └────┬─────┘
                │ APScheduler picks it up (by priority)
                ▼
           ┌─────────┐
           │ RUNNING  │ ← Executing replay
           │ 0–100%  │   (progress = elapsed / duration)
           └────┬─────┘
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
  ┌─────────┐ ┌──────┐ ┌──────────┐
  │COMPLETED│ │FAILED│ │CANCELLED │
  │  100%   │ │ 20-85│ │   0%     │
  └─────────┘ └──┬───┘ └──────────┘
                  │
                  │ User clicks "Reschedule"
                  ▼
            ┌──────────┐
            │ RE-QUEUED │ ← match_id uppercased, +30 priority
            └──────────┘
```

### Progress Phases

1. **Waiting Phase (0–89%)**: From creation until scheduled time arrives. Progress proportional to elapsed wait.
2. **Running Phase (0–100%)**: Once scheduled time is reached, progress tracks replay execution over `runtime_duration` seconds.

### MongoDB Collections

| Collection | Contains | Indexed On |
|-----------|----------|------------|
| `replay_jobs` | Active jobs (queued + running) | `status`, `priority`, `created_at` |
| `replay_history` | Finished jobs (completed/failed/cancelled) | `status`, `created_at`, `match_id` |

When a job finishes, it is **deleted** from `replay_jobs` and **inserted** into `replay_history`.

---

## 👥 Team

This project was built by a 3-member team. See [`PRESENTATION_GUIDE.md`](./PRESENTATION_GUIDE.md) for presentation roles, talking points, and a live demo script.

---

## 📝 License

Internal QA tool — not for public distribution.
