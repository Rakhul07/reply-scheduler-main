export default function ProgressBar({ progress, status }) {
    const colorMap = {
        queued: "from-slate-400 to-slate-300",
        running: "from-blue-500 to-cyan-400",
        completed: "from-emerald-500 to-green-400",
        failed: "from-red-500 to-rose-400",
        cancelled: "from-amber-500 to-yellow-400",
    };

    const bgMap = {
        queued: "bg-slate-100",
        running: "bg-blue-100",
        completed: "bg-emerald-100",
        failed: "bg-red-100",
        cancelled: "bg-amber-100",
    };

    const gradient = colorMap[status] || colorMap.queued;
    const bg = bgMap[status] || bgMap.queued;

    return (
        <div className="flex items-center gap-3 min-w-[160px]">
            <div className={`flex-1 h-2.5 rounded-full ${bg} overflow-hidden`}>
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out ${status === "running" ? "animate-pulse" : ""
                        }`}
                    style={{ width: `${Math.max(progress, status === "queued" ? 0 : 2)}%` }}
                />
            </div>
            <span className="text-xs font-mono text-slate-500 w-10 text-right tabular-nums">
                {progress}%
            </span>
        </div>
    );
}
