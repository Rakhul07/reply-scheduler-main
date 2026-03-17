import { useState } from "react";
import toast from "react-hot-toast";
import { scheduleReplay } from "../api";

export default function ReplayForm({ onScheduled }) {
    const [matchId, setMatchId] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [runtimeDuration, setRuntimeDuration] = useState(30);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    function validate() {
        const errs = {};
        if (!matchId.trim()) errs.matchId = "Match ID is required";
        if (!scheduledTime) {
            errs.scheduledTime = "Scheduled time is required";
        } else if (new Date(scheduledTime) <= new Date()) {
            errs.scheduledTime = "Scheduled time must be in the future";
        }
        if (!runtimeDuration || runtimeDuration < 5) {
            errs.runtimeDuration = "Runtime must be at least 5 seconds";
        }
        if (runtimeDuration > 3600) {
            errs.runtimeDuration = "Runtime cannot exceed 3600 seconds (1 hour)";
        }
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            await scheduleReplay(
                matchId.trim(),
                scheduledTime,
                parseInt(runtimeDuration, 10)
            );
            toast.success(`Replay scheduled for ${matchId} (${runtimeDuration}s runtime)`);
            setMatchId("");
            setScheduledTime("");
            setRuntimeDuration(30);
            setErrors({});
            onScheduled?.();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Schedule Replay</h2>
                </div>

                <div className="space-y-5">
                    {/* Match ID */}
                    <div>
                        <label htmlFor="matchId" className="block text-sm font-medium text-slate-700 mb-2">
                            Match ID
                        </label>
                        <input
                            id="matchId"
                            type="text"
                            placeholder="e.g. MATCH_1001 or VIP_MATCH_42"
                            value={matchId}
                            onChange={(e) => setMatchId(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${errors.matchId
                                ? "border-red-300 focus:ring-red-200"
                                : "border-slate-200 focus:ring-violet-200 focus:border-violet-400"
                                }`}
                        />
                        {errors.matchId && (
                            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {errors.matchId}
                            </p>
                        )}
                    </div>

                    {/* Scheduled Time + Runtime Duration in a row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Scheduled Time */}
                        <div>
                            <label htmlFor="scheduledTime" className="block text-sm font-medium text-slate-700 mb-2">
                                Scheduled Time
                            </label>
                            <input
                                id="scheduledTime"
                                type="datetime-local"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${errors.scheduledTime
                                    ? "border-red-300 focus:ring-red-200"
                                    : "border-slate-200 focus:ring-violet-200 focus:border-violet-400"
                                    }`}
                            />
                            {errors.scheduledTime && (
                                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {errors.scheduledTime}
                                </p>
                            )}
                        </div>

                        {/* Runtime Duration */}
                        <div>
                            <label htmlFor="runtimeDuration" className="block text-sm font-medium text-slate-700 mb-2">
                                Video Runtime (seconds)
                            </label>
                            <div className="relative">
                                <input
                                    id="runtimeDuration"
                                    type="number"
                                    min={5}
                                    max={3600}
                                    step={5}
                                    value={runtimeDuration}
                                    onChange={(e) => setRuntimeDuration(e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${errors.runtimeDuration
                                        ? "border-red-300 focus:ring-red-200"
                                        : "border-slate-200 focus:ring-violet-200 focus:border-violet-400"
                                        }`}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                                    sec
                                </span>
                            </div>
                            {errors.runtimeDuration && (
                                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {errors.runtimeDuration}
                                </p>
                            )}
                            <p className="mt-1.5 text-xs text-slate-400">How long the replay video runs (5–3600s)</p>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Scheduling…
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Schedule Replay
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
