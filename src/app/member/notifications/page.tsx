"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface Notif { id: string; title: string; body: string; type: string; isRead: boolean; link?: string; createdAt: string; }

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/notifications");
      const d = await res.json();
      if (d.success) setNotifs(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const typeIcon = (t: string) => {
    if (t === "EVENT") return "📅";
    if (t === "PRAYER") return "🙏";
    if (t === "ATTENDANCE") return "✅";
    return "🔔";
  };

  if (loading) return <div className="space-y-4 animate-fade-in">{[1,2,3].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">Notifications</h2>
        <p className="text-sm text-muted-foreground">Stay updated with church activities</p>
      </div>

      {notifs.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">🔔</span>
          <p className="font-semibold">No Notifications</p>
          <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        notifs.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={`card flex items-start gap-3 ${!n.isRead ? "border-primary/30 bg-primary/5" : ""}`}
          >
            <span className="text-xl shrink-0">{typeIcon(n.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
          </motion.div>
        ))
      )}
    </div>
  );
}
