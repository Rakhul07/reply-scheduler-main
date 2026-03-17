import { useMemo } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function rateToColor(rate) {
  if (rate === null) return "#f1f5f9"; // slate-100, no data
  if (rate >= 90) return "#059669";    // emerald-600
  if (rate >= 75) return "#10b981";    // emerald-500
  if (rate >= 60) return "#34d399";    // emerald-400
  if (rate >= 40) return "#fbbf24";    // amber-400
  if (rate >= 20) return "#f97316";    // orange-500
  return "#ef4444";                    // red-500
}

function formatHour(h) {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

export default function OnTimeHeatmap({ data }) {
  const grid = useMemo(() => {
    const map = {};
    for (const entry of data) {
      map[`${entry.day}-${entry.hour}`] = entry;
    }
    return map;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-1">On-Time Completion Rate by Time Slot</h3>
        <p className="text-xs text-slate-500 mb-4">% of tasks completed within expected duration, by day &times; hour</p>
        <p className="text-sm text-slate-400 text-center py-8">No completed replay data yet. Schedule and run some replays to see the heatmap.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-1">On-Time Completion Rate by Time Slot</h3>
      <p className="text-xs text-slate-500 mb-4">% of tasks completed within expected duration, by day &times; hour</p>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1" style={{ minWidth: "fit-content" }}>
          {/* Hour labels */}
          <div className="flex gap-1 ml-10">
            {HOURS.map((h) => (
              <div key={h} className="w-7 text-center text-[10px] text-slate-400 font-mono">
                {h % 3 === 0 ? formatHour(h) : ""}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {DAYS.map((dayLabel, dayIdx) => (
            <div key={dayLabel} className="flex items-center gap-1">
              <span className="w-9 text-xs text-slate-500 font-medium text-right pr-1">{dayLabel}</span>
              {HOURS.map((h) => {
                const entry = grid[`${dayIdx}-${h}`];
                const rate = entry ? entry.rate : null;
                const total = entry ? entry.total : 0;
                const onTime = entry ? entry.on_time : 0;
                return (
                  <div
                    key={h}
                    className="w-7 h-7 rounded-sm cursor-default transition-transform hover:scale-125 hover:z-10 relative group"
                    style={{ backgroundColor: rateToColor(rate) }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                      <div className="bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <div className="font-semibold">{dayLabel} {formatHour(h)}</div>
                        {rate !== null ? (
                          <>
                            <div className="text-emerald-300">{rate}% on-time</div>
                            <div className="text-slate-300">{onTime}/{total} jobs</div>
                          </>
                        ) : (
                          <div className="text-slate-400">No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-500">
        <span>Worse</span>
        {[
          { color: "#ef4444", label: "0-19%" },
          { color: "#f97316", label: "20-39%" },
          { color: "#fbbf24", label: "40-59%" },
          { color: "#34d399", label: "60-74%" },
          { color: "#10b981", label: "75-89%" },
          { color: "#059669", label: "90-100%" },
        ].map((l) => (
          <div key={l.color} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
        <span>Better</span>
        <div className="flex items-center gap-1 ml-2">
          <div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" />
          <span>No data</span>
        </div>
      </div>
    </div>
  );
}
