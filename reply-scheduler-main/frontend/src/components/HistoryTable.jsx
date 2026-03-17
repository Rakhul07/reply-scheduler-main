import { useState } from "react";
import toast from "react-hot-toast";
import { getReplayLogs, rescheduleReplay } from "../api";
import ProgressBar from "./ProgressBar";

const statusConfig = {
    completed: { label: "Completed", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    failed: { label: "Failed", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    cancelled: { label: "Cancelled", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.completed;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function LogModal({ logs, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h3 className="text-slate-800 font-semibold">Replay Logs</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-2 flex-1 font-mono text-xs">
                    {logs.length === 0 ? (
                        <p className="text-slate-400 text-center">No logs</p>
                    ) : (
                        logs.map((entry, i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-slate-400 shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                <span className="text-slate-700">{entry.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HistoryTable({ items }) {
    const [logModal, setLogModal] = useState(null);

    async function handleViewLogs(id) {
        try {
            const logs = await getReplayLogs(id);
            setLogModal(logs);
        } catch (err) {
            toast.error(err.message);
        }
    }

    async function handleReschedule(id) {
        try {
            await rescheduleReplay(id);
            toast.success("Job rescheduled! Moving back to queue.");
            // We need a way to refresh, but onRefresh isn't currently passed to HistoryTable.
            // However, the App wrapper automatically polls every 5s, so it will show up shortly.
            // But doing an immediate reload makes UI feel faster. Let's trigger a reload.
            window.location.reload();
        } catch (err) {
            toast.error(err.message);
        }
    }

    if (items.length === 0) {
        return (
            <div className="w-full max-w-5xl mx-auto mt-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Replay History</h2>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                    <p className="text-slate-400 text-sm">No replay history yet — completed replays will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto mt-8">
            {logModal && <LogModal logs={logModal} onClose={() => setLogModal(null)} />}

            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800">Replay History</h2>
                <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">{items.length} total</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Match ID</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">Result</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-medium text-slate-800">{job.match_id}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(job.scheduled_time).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-mono text-xs px-2 py-0.5 rounded-md border ${job.priority >= 50
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-slate-50 text-slate-500 border-slate-200"
                                            }`}>
                                            {job.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={job.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        {job.status === "completed" ? (
                                            <ProgressBar progress={100} status="completed" />
                                        ) : job.error_message ? (
                                            <span className="text-xs text-red-600">{job.error_message}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewLogs(job.id)}
                                                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
                                            >
                                                Logs
                                            </button>
                                            {job.status === "failed" && (
                                                <button
                                                    onClick={() => handleReschedule(job.id)}
                                                    className="px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-all duration-200 cursor-pointer"
                                                >
                                                    Reschedule
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
