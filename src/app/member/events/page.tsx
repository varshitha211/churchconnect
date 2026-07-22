"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface EventData {
  id: string; name: string; slug: string; category: string; description?: string;
  startDate: string; endDate?: string; startTime: string; venue: string; status: string;
  rsvpCounts: { attending: number; maybe: number; notAttending: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/events/public");
      const d = await res.json();
      if (d.success) setEvents(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const filtered = events.filter((e) => {
    if (e.status === "LIVE") return true;
    return filter === "upcoming" ? new Date(e.startDate) >= now : new Date(e.startDate) < now;
  });

  function addToCalendar(e: EventData) {
    const start = new Date(e.startDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.name)}&dates=${start}/${start}&location=${encodeURIComponent(e.venue)}&details=${encodeURIComponent(e.description || "")}`;
    window.open(url, "_blank");
  }

  if (loading) return <div className="space-y-4 animate-fade-in">{[1,2,3].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">Events</h2>
        <p className="text-sm text-muted-foreground">Browse and register for church events</p>
      </div>

      <div className="flex gap-2">
        {(["upcoming", "past"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}>
            {f === "upcoming" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">📅</span>
          <p className="font-semibold">No {filter} events</p>
        </div>
      ) : (
        filtered.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-primary-light -mx-6 -mt-6 mb-4" />
            <div className="flex items-start justify-between mb-2">
              <span className="badge badge-primary">{e.category.replace("_", " ")}</span>
              <span className="text-xs text-muted-foreground">
                {e.rsvpCounts.attending} attending
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">{e.name}</h3>
            {e.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{e.description}</p>}
            <div className="space-y-1 text-sm text-muted-foreground mb-4">
              <p>📅 {new Date(e.startDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
              <p>⏰ {e.startTime}</p>
              <p>📍 {e.venue}</p>
            </div>
            <div className="flex gap-2">
              <a href={`/event/${e.slug}`} className="btn btn-primary btn-sm flex-1">View Details</a>
              <button onClick={() => addToCalendar(e)} className="btn btn-secondary btn-sm">📅 Add</button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
