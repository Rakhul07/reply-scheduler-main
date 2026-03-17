import { useState } from "react";
import toast from "react-hot-toast";
import { cancelReplay, getReplayLogs } from "../api";
import ProgressBar from "./ProgressBar";

const statusConfig = {
    queued: { label: "Queued", dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
    running: { label: "Running", dot: "bg-blue-500 animate-pulse", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    completed: { label: "Completed", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    failed: { label: "Failed", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    cancelled: { label: "Cancelled", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.queued;
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
                        <p className="text-slate-400 text-center">No logs yet</p>
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

export default function ReplayTable({ replays, onRefresh }) {
    const [logModal, setLogModal] = useState(null);

    async function handleCancel(id) {
        try {
            await cancelReplay(id);
            toast.success("Replay cancelled");
            onRefresh?.();
        } catch (err) {
            toast.error(err.message);
        }
    }

    async function handleViewLogs(id) {
        try {
            const logs = await getReplayLogs(id);
            setLogModal(logs);
        } catch (err) {
            toast.error(err.message);
        }
    }

    if (replays.length === 0) {
        return (
            <div className="w-full max-w-5xl mx-auto mt-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25-2.25M9.75 18l2.25 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-slate-600 text-lg font-medium">No replays in queue</p>
                    <p className="text-slate-400 text-sm mt-1">Schedule your first replay above to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto mt-8">
            {logModal && <LogModal logs={logModal} onClose={() => setLogModal(null)} />}

            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800">Replay Queue</h2>
                <span className="ml-auto text-xs text-slate-400">Auto-refreshes every 5s</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Match ID</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Runtime</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">Progress</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {replays.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-medium text-slate-800">{job.match_id}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(job.scheduled_time).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                            {job.runtime_duration}s
                                        </span>
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
                                        <ProgressBar progress={job.progress} status={job.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewLogs(job.id)}
                                                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
                                                title="View Logs"
                                            >
                                                Logs
                                            </button>
                                            {job.status === "queued" && (
                                                <button
                                                    onClick={() => handleCancel(job.id)}
                                                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {job.status === "running" && (
                                                <span className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed">
                                                    Cancel
                                                </span>
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
