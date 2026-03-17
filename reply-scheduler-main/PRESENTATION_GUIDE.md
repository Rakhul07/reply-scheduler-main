# 🎤 Match Replay Scheduler — Presentation Guide

> **Team Size:** 3 members  
> **Estimated Duration:** 12–15 minutes  
> **Format:** Slides + Live Demo

---

## 👥 Role Assignments

| Role | Member | Responsibilities | Duration |
|------|--------|-----------------|----------|
| **Presenter 1** | Member A | Introduction, Problem Statement, Architecture | ~4 min |
| **Presenter 2** | Member B | Backend Deep-Dive, API Demo (Swagger), Live Terminal Logs | ~4 min |
    | **Presenter 3** | Member C | Frontend Demo, Live Walkthrough, Q&A Lead | ~4 min |

---

## 📊 Slide Deck Outline (10–12 slides)

### Slide 1 — Title Slide
```
Match Replay Scheduler
Internal QA Tool for Scheduling & Monitoring Match Replays

Team Members: [Name A], [Name B], [Name C]
Date: March 2026
```

---

### Slide 2 — Problem Statement (Presenter 1)

**Talking Points:**
- "In QA environments, replaying recorded matches is essential for regression testing"
- "Currently there's no centralized way to schedule, queue, and monitor replays"
- "Manual replay execution doesn't scale — we need automation"

```
❌ Problems:
   • No centralized replay scheduling
   • No visibility into queue status or progress
   • No priority system — VIP matches wait alongside routine ones
   • No execution logs for debugging failures

✅ Our Solution:
   • Web-based scheduler with real-time monitoring
   • Priority queue — high-risk matches run first
   • Detailed execution logs per replay
   • Automatic concurrency management (max 3 parallel)
```

---

### Slide 3 — Tech Stack (Presenter 1)

```
┌────────────────────────────────────────┐
│            TECH STACK                   │
├──────────────┬─────────────────────────┤
│ Frontend     │ React 19 + Vite 8       │
│ Styling      │ TailwindCSS v4          │
│ Routing      │ React Router v7         │
│ Notifications│ react-hot-toast         │
│ Backend      │ FastAPI (Python)        │
│ Scheduler    │ APScheduler 3.x        │
│ Server       │ Uvicorn (ASGI)         │
│ Storage      │ In-Memory (Python dict)│
│ Communication│ REST API + Polling (5s)│
└──────────────┴─────────────────────────┘
```

**Talking Points:**
- "We chose FastAPI for its async support — perfect for background task management"
- "React + Vite gives us fast hot-reload during development"
- "APScheduler handles the job dispatching with an interval trigger every 2 seconds"
- "In-memory storage is intentional — this is a QA tool, not production data"

---

### Slide 4 — Architecture Diagram (Presenter 1)

```
┌─────────────────────┐         ┌──────────────────────┐
│     FRONTEND        │  REST   │      BACKEND         │
│                     │  API    │                       │
│  React + Vite       │────────►│  FastAPI + APSched    │
│  TailwindCSS        │◄────────│                       │
│                     │ Polling │  ┌─────────────────┐  │
│  ┌───────────────┐  │  (5s)   │  │  In-Memory Queue│  │
│  │ Schedule Form │  │         │  │  ┌─────┐ ┌─────┐│  │
│  │ Queue Table   │  │         │  │  │Job 1│ │Job 2││  │
│  │ History Table │  │         │  │  └─────┘ └─────┘│  │
│  │ Progress Bars │  │         │  └─────────────────┘  │
│  └───────────────┘  │         │                       │
└─────────────────────┘         │  ┌─────────────────┐  │
                                │  │  History Store   │  │
                                │  │  (completed jobs)│  │
                                │  └─────────────────┘  │
                                └──────────────────────┘
```

**Talking Points:**
- "The frontend communicates with the backend through 6 REST endpoints"
- "Frontend polls every 5 seconds — no WebSockets needed for this use case"
- "APScheduler runs in the background, checking the queue every 2 seconds"
- "When a job finishes, it moves from the active queue to the history store"

---

### Slide 5 — User Flow Diagram (Presenter 1)

```
  Enter Match ID ──► Pick Date/Time ──► Set Video Runtime
                                              │
                                              ▼
                                      Click "Schedule"
                                              │
                              ┌───────────────┼───────────────┐
                              │                               │
                        Validation Fails                Validation OK
                              │                               │
                              ▼                               ▼
                        Show Errors                   Job → Queue
                                                          │
                                             ┌────────────┤
                                             │            │
                                        User Cancels   Time Arrives
                                             │            │
                                             ▼            ▼
                                        → History    Status: Running
                                                     Progress: 0→100%
                                                          │
                                                   ┌──────┴──────┐
                                                   │             │
                                               Complete       Failure
                                                   │             │
                                                   └──────┬──────┘
                                                          ▼
                                                     → History
                                                     (with logs)
```

---

### Slide 6 — Backend Deep-Dive (Presenter 2)

**Talking Points:**

```
📁 backend/app/

├── models.py      → Data models + Priority scoring
│   • ReplayJob: id, match_id, scheduled_time, runtime_duration,
│                 status, progress, priority, logs
│   • Priority: VIP/HIGH → +50, Previously failed → +30, Base → 10
│
├── scheduler.py   → APScheduler + Workers
│   • In-memory: jobs dict (active) + history dict (finished)
│   • Dispatcher runs every 2s, max 3 concurrent workers
│   • Worker phases: WAIT → RUN (over runtime_duration) → HISTORY
│   • 10% random failure simulation for realistic testing
│
├── routes.py      → 6 REST endpoints
│   • POST /replays/schedule    (create job)
│   • GET  /replays/            (active queue)
│   • GET  /replays/history     (finished jobs)
│   • GET  /replays/{id}        (single job)
│   • DELETE /replays/{id}      (cancel queued)
│   • GET  /replays/{id}/logs   (execution logs)
│
└── main.py        → App setup, CORS, lifespan hooks
```

---

### Slide 7 — API Demo (Presenter 2)

**Live Demo — open http://localhost:8000/docs (Swagger UI)**

Show these in order:
1. **POST /replays/schedule** — schedule a VIP match
2. **GET /replays/** — show it in the queue
3. Point out the **priority scoring** (VIP gets 60 vs default 10)
4. Show **validation errors** — empty match_id, past time

**Talking Points:**
- "FastAPI auto-generates interactive API docs"
- "All validation is server-side — empty match ID returns 400, past time returns 400"
- "The priority system ensures critical matches are processed first"

---

### Slide 8 — Frontend Overview (Presenter 3)

```
📁 frontend/src/

├── components/
│   ├── ReplayForm.jsx     → Schedule form with validation
│   │   • Match ID input
│   │   • Date-time picker  
│   │   • Video runtime input (5–3600 seconds)
│   │   • Client-side validation + toast notifications
│   │
│   ├── ReplayTable.jsx    → Active queue with live updates
│   │   • Status badges (Queued/Running)
│   │   • Animated progress bars
│   │   • Cancel button (queued only)
│   │   • Log viewer modal
│   │
│   ├── HistoryTable.jsx   → Finished replays
│   │   • Completed / Failed / Cancelled
│   │   • Error messages for failures
│   │   • Log viewer for debugging
│   │
│   └── ProgressBar.jsx    → Status-aware animated bar
│
├── api.js                 → REST client (fetch-based)
└── App.jsx                → Layout, routing, polling logic
```

---

### Slide 9 — Live Frontend Demo (Presenter 3)

**📺 Open http://localhost:5173/tools/replay-scheduler**

**Demo Script (follow this order):**

```
Step 1: Show the empty dashboard
   → "Here's the main page — clean light UI with stat cards,
      schedule form, queue, and history sections"

Step 2: Schedule a replay
   → Match ID: "VIP_MATCH_42"
   → Time: 2 minutes from now
   → Runtime: 15 seconds
   → Click "Schedule Replay"
   → "Notice the toast notification and the job appearing in the queue"

Step 3: Schedule a second replay
   → Match ID: "MATCH_1001"  
   → Time: same time
   → Runtime: 10 seconds
   → "This one has lower priority (10) vs the VIP match (60)"

Step 4: Show validation errors
   → Leave Match ID empty → click Schedule → show inline error
   → Pick a past date → show error
   → "All validation happens both client-side AND server-side"

Step 5: Watch progress update
   → "The table auto-refreshes every 5 seconds"
   → "Notice the VIP match runs first because of higher priority"
   → Wait for scheduled time → show progress bar filling up

Step 6: Show the Log viewer
   → Click "Logs" on a running or completed job
   → "Every stage is logged — creation, scheduling, progress, completion"

Step 7: Show History
   → After jobs complete, they move to the History section
   → "The queue is now clean, finished jobs live in History"

Step 8: Cancel demo (optional — schedule another job)
   → Schedule a job with a far-future time
   → Click "Cancel" while it's queued
   → "Only queued jobs can be cancelled — running jobs continue"
```

---

### Slide 10 — Key Features Summary (Presenter 3)

```
✅ Core Features
   • Schedule replays with Match ID, future time, video runtime
   • Real-time progress monitoring (5s polling)
   • Cancel queued jobs
   • Execution history with logs

🧠 Smart Queue
   • Max 3 concurrent replays
   • Priority scoring: VIP (+50), Failed retry (+30)
   • Auto-promotes queued jobs when slots free up
   • Jobs pop from queue on completion

📊 Transparency
   • Per-job timestamped execution logs
   • Dashboard stats (Queued, Running, Completed, Failed, Cancelled)
   • Status badges with colored progress bars

⚡ Tech Highlights
   • APScheduler for background job dispatch
   • Async workers with real-time progress updates  
   • 10% random failure simulation for realistic QA
   • Clean REST API with Swagger docs
```

---

### Slide 11 — Future Enhancements (Any member)

```
🔮 What We'd Add Next:

1. Persistent Storage
   → SQLite or PostgreSQL to survive server restarts

2. WebSocket Updates
   → Replace polling with real-time push notifications

3. User Authentication
   → Login system with role-based access

4. Email/Slack Notifications
   → Alert QA team when replays complete or fail

5. Replay Analytics Dashboard
   → Charts showing success rates, avg runtime, peak usage

6. Bulk Scheduling
   → Upload CSV of match IDs to schedule many at once
```

---

### Slide 12 — Thank You + Q&A (All members)

```
🎯 Match Replay Scheduler

Thank you!

Team: [Name A] · [Name B] · [Name C]

Questions?

GitHub: [repo link]
Live Demo: http://localhost:5173/tools/replay-scheduler  
API Docs: http://localhost:8000/docs
```

---

## 🧪 Pre-Presentation Checklist

```
Before presenting, make sure:

□  Backend is running:
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

□  Frontend is running:
   cd frontend
   npm run dev

□  Open these tabs in browser:
   • http://localhost:5173/tools/replay-scheduler  (Frontend)
   • http://localhost:8000/docs                    (Swagger)

□  Clear any old data (restart backend to reset in-memory queue)

□  Test a quick schedule + cancel to make sure everything works

□  Have the README.md open for reference
```

---

## ⏱️ Timing Breakdown

| Section | Who | Duration |
|---------|-----|----------|
| Introduction + Problem | Presenter 1 | 1.5 min |
| Tech Stack + Architecture | Presenter 1 | 2.5 min |
| Backend Deep-Dive | Presenter 2 | 2 min |
| API Demo (Swagger) | Presenter 2 | 2 min |
| Frontend Code Overview | Presenter 3 | 1.5 min |
| Live Demo Walkthrough | Presenter 3 | 3 min |
| Key Features + Future Work | All | 1.5 min |
| Q&A | All | 2 min |
| **Total** | | **~14 min** |

---

## 💡 Pro Tips

1. **Presenter 1** should set context — make the audience understand WHY this tool matters
2. **Presenter 2** should use the Swagger UI live — it's impressive and interactive
3. **Presenter 3** should demo the VIP priority feature — it's a "wow" moment when the VIP job runs before others
4. **Schedule jobs 1–2 min in the future** during the demo — this gives time to talk while waiting for execution
5. If a job randomly **fails** during demo — that's actually good! Say "this simulates real-world failures for QA"
6. Keep terminal logs visible on a side screen — they show the APScheduler dispatching in real-time
