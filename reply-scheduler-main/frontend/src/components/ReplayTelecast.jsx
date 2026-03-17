import ProgressBar from "./ProgressBar";

export default function ReplayTelecast({ replays }) {
    const runningReplays = replays.filter((r) => r.status === "running");

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Replay Telecast</h2>
                        {runningReplays.length > 0 && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Live</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Telecast Screen Area */}
                <div className="relative rounded-xl overflow-hidden border-2 border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[280px]">
                    {/* Scan-line overlay effect */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
                        style={{
                            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
                        }}
                    />

                    {/* Corner decorations — TV screen feel */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">REC</span>
                    </div>
                    <div className="absolute top-3 right-3 z-20">
                        <span className="text-[10px] font-mono text-slate-500">
                            {new Date().toLocaleTimeString()} 
                        </span>
                    </div>

                    {runningReplays.length === 0 ? (
                        /* No Signal State */
                        <div className="flex flex-col items-center justify-center h-[280px] text-center">
                            <div className="relative">
                                <svg className="w-16 h-16 text-slate-600 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-500">No Replay In Progress</p>
                            <p className="mt-1 text-xs text-slate-600">Schedule a replay to see it live here</p>
                            <div className="flex items-center gap-1.5 mt-4">
                                <div className="w-3 h-0.5 bg-slate-700 rounded-full" />
                                <div className="w-3 h-0.5 bg-slate-700 rounded-full" />
                                <div className="w-3 h-0.5 bg-slate-700 rounded-full" />
                            </div>
                        </div>
                    ) : (
                        /* Running Replays */
                        <div className="p-5 space-y-3">
                            {runningReplays.map((replay) => (
                                <div
                                    key={replay.id}
                                    className="relative bg-slate-800/80 backdrop-blur border border-slate-700/50 rounded-lg p-4 transition-all duration-300 hover:border-blue-500/30"
                                >
                                    {/* Top Row: Match ID + Status */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white tracking-wide">{replay.match_id}</p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {replay.id.slice(0, 8)}…</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Playing</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-2.5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Progress</span>
                                            <span className="text-xs font-bold text-blue-400 font-mono tabular-nums">{replay.progress}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-700/60 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 ease-out animate-pulse"
                                                style={{ width: `${Math.max(replay.progress, 2)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Info Row */}
                                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {replay.runtime_duration}s runtime
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Priority: {replay.priority}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom bar — TV channel info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                            CH: REPLAY-QA • {runningReplays.length} active stream{runningReplays.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full ${
                                            i < Math.min(runningReplays.length + 2, 5)
                                                ? "bg-green-400 h-2.5"
                                                : "bg-slate-600 h-1.5"
                                        } transition-all duration-300`}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">HD</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}