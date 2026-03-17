const API_BASE = "http://localhost:8000";

/**
 * Schedule a new replay job.
 */
export async function scheduleReplay(matchId, scheduledTime, runtimeDuration) {
    const res = await fetch(`${API_BASE}/replays/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            match_id: matchId,
            scheduled_time: scheduledTime,
            runtime_duration: runtimeDuration,
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to schedule replay");
    }

    return res.json();
}

/**
 * Fetch active queue (queued + running).
 */
export async function getReplays() {
    const res = await fetch(`${API_BASE}/replays/`);
    if (!res.ok) throw new Error("Failed to fetch replays");
    return res.json();
}

/**
 * Fetch replay history (completed / failed / cancelled).
 */
export async function getHistory() {
    const res = await fetch(`${API_BASE}/replays/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
}

/**
 * Cancel a queued replay job.
 */
export async function cancelReplay(id) {
    const res = await fetch(`${API_BASE}/replays/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to cancel replay");
    }

    return res.json();
}

/**
 * Reschedule a failed replay job.
 */
export async function rescheduleReplay(id) {
    const res = await fetch(`${API_BASE}/replays/${id}/reschedule`, {
        method: "POST",
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to reschedule replay");
    }

    return res.json();
}

/**
 * Get logs for a specific replay job.
 */
export async function getReplayLogs(id) {
    const res = await fetch(`${API_BASE}/replays/${id}/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    return res.json();
}

/**
 * Fetch analytics data (heatmap + trend).
 */
export async function getAnalytics() {
    const res = await fetch(`${API_BASE}/replays/analytics`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
}
