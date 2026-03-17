import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ScheduledVsCompletedTrend({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Scheduled vs Completed Trend</h3>
        <p className="text-xs text-slate-500 mb-4">Daily scheduled count vs completed count</p>
        <p className="text-sm text-slate-400 text-center py-8">No data yet. Schedule and run some replays to see the trend.</p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.scheduled, d.completed)),
    1
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-1">Scheduled vs Completed Trend</h3>
      <p className="text-xs text-slate-500 mb-4">Daily scheduled count vs completed count — growing gap signals backlog</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            allowDecimals={false}
            domain={[0, Math.ceil(maxVal * 1.1)]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 13 }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="scheduled"
            name="Scheduled"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#6366f1" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#10b981" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
