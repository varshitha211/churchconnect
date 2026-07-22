"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface AttendanceData {
  monthAttendance: { id: string; checkedInAt: string; method: string; event: { name: string; startDate: string; venue: string } }[];
  yearAttendance: { month: string; count: number }[];
  calendarDays: Record<string, boolean>;
  stats: { monthCount: number; yearCount: number; totalEvents: number; percentage: number };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MyAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/attendance");
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="space-y-4 animate-fade-in"><div className="h-32 skeleton rounded-2xl" /><div className="h-64 skeleton rounded-2xl" /></div>;
  if (!data) return <div className="text-center py-20 text-muted-foreground">No data</div>;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const maxBar = Math.max(...data.yearAttendance.map((m) => m.count), 1);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">My Attendance</h2>
        <p className="text-sm text-muted-foreground">Track your church attendance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "This Month", value: data.stats.monthCount, color: "text-primary" },
          { label: "This Year", value: data.stats.yearCount, color: "text-blue-600" },
          { label: "Attendance", value: `${data.stats.percentage}%`, color: "text-green-600" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="btn btn-ghost btn-sm">←</button>
          <h3 className="font-bold">{MONTHS[calMonth]} {calYear}</h3>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="btn btn-ghost btn-sm">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-muted-foreground font-medium py-1">{d}</div>)}
          {calDays.map((day, i) => (
            <div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
              day && data.calendarDays[day.toString()] ? "bg-primary text-white font-bold" : day ? "hover:bg-muted" : ""
            }`}>
              {day || ""}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">Highlighted days = attended</p>
      </div>

      {/* Year Chart */}
      <div className="card">
        <h3 className="font-bold mb-4">Yearly Overview</h3>
        <div className="flex items-end gap-2 h-32">
          {MONTHS.map((m) => {
            const count = data.yearAttendance.find((y) => y.month === m)?.count || 0;
            const pct = (count / maxBar) * 100;
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">{count || ""}</span>
                <div className="w-full bg-primary/10 rounded-lg relative" style={{ height: "80px" }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-lg transition-all" style={{ height: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{m}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent History */}
      <div className="card">
        <h3 className="font-bold mb-3">Recent Attendance</h3>
        {data.monthAttendance.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No attendance records this month</p>
        ) : (
          <div className="space-y-2">
            {data.monthAttendance.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {new Date(r.checkedInAt).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.event.name}</p>
                  <p className="text-xs text-muted-foreground">{r.event.venue} · {new Date(r.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <span className={`badge text-xs ${r.method === "QR_SCAN" ? "badge-info" : "badge-success"}`}>
                  {r.method === "QR_SCAN" ? "📱 QR" : "✏️ Manual"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
