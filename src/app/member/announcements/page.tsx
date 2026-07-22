"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface Announcement {
  id: string; title: string; description: string; priority: string;
  attachment?: string; createdAt: string;
}

export default function AnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/announcements");
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const priorityColor = (p: string) => {
    if (p === "URGENT") return "bg-red-50 border-red-200";
    if (p === "HIGH") return "bg-orange-50 border-orange-200";
    return "bg-card border-border";
  };

  const priorityBadge = (p: string) => {
    if (p === "URGENT") return <span className="badge badge-destructive">Urgent</span>;
    if (p === "HIGH") return <span className="badge badge-warning">Important</span>;
    return null;
  };

  if (loading) return <div className="space-y-4 animate-fade-in">{[1,2,3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">Announcements</h2>
        <p className="text-sm text-muted-foreground">Latest updates from the church</p>
      </div>

      {data.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">📢</span>
          <p className="font-semibold">No Announcements</p>
          <p className="text-sm text-muted-foreground mt-1">Check back later for updates</p>
        </div>
      ) : (
        data.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card border ${priorityColor(a.priority)}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-sm">{a.title}</h3>
              {priorityBadge(a.priority)}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</p>
            {a.attachment && (
              <a href={a.attachment} target="_blank" rel="noopener" className="btn btn-secondary btn-sm mt-3 text-xs">
                📎 View Attachment
              </a>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              {new Date(a.createdAt).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </motion.div>
        ))
      )}
    </div>
  );
}
