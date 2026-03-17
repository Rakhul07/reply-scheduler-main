import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ReplayForm from "./components/ReplayForm";
import LandingPage from "./pages/LandingPage";
import ReplayTelecast from "./components/ReplayTelecast";
import ReplayTable from "./components/ReplayTable";
import HistoryTable from "./components/HistoryTable";
import OnTimeHeatmap from "./components/OnTimeHeatmap";
import ScheduledVsCompletedTrend from "./components/ScheduledVsCompletedTrend";
import { getReplays, getHistory, getAnalytics } from "./api";

function ReplaySchedulerPage() {
  const [replays, setReplays] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [analytics, setAnalytics] = useState({ heatmap: [], trend: [] });

  const fetchAll = useCallback(async () => {
    try {
      const [queue, hist, analyticsData] = await Promise.all([
        getReplays(),
        getHistory(),
        getAnalytics(),
      ]);
      setReplays(queue);
      setHistoryItems(hist);
      setAnalytics(analyticsData);
    } catch {
      // silently retry on next poll
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const queuedCount = replays.filter((r) => r.status === "queued").length;
  const runningCount = replays.filter((r) => r.status === "running").length;
  const completedCount = historyItems.filter((r) => r.status === "completed").length;
  const failedCount = historyItems.filter((r) => r.status === "failed").length;
  const cancelledCount = historyItems.filter((r) => r.status === "cancelled").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Match Replay Scheduler</h1>
                <p className="text-xs text-slate-500">Internal QA Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">/tools/replay-scheduler</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Backend connected" />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Queued", value: queuedCount, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: "⏳" },
              { label: "Running", value: runningCount, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: "▶️" },
              { label: "Completed", value: completedCount, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: "✅" },
              { label: "Failed", value: failedCount, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: "❌" },
              { label: "Cancelled", value: cancelledCount, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: "🚫" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl px-5 py-4 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{stat.icon}</span>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold mt-1.5 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Replay Telecast Screen */}
          <ReplayTelecast replays={replays} />

          {/* Schedule form */}
          <ReplayForm onScheduled={fetchAll} />

          {/* Active queue */}
          <ReplayTable replays={replays} onRefresh={fetchAll} />

          {/* History */}
          <HistoryTable items={historyItems} />

          {/* Analytics Charts */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Analytics</h2>
            <OnTimeHeatmap data={analytics.heatmap} />
            <ScheduledVsCompletedTrend data={analytics.trend} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#ffffff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tools/replay-scheduler" element={<ReplaySchedulerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}