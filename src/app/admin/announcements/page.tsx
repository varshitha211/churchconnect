"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: string;
  isPublished: boolean;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteAnnouncement(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  }

  const priorityBadge = (p: string) => {
    if (p === "URGENT") return <span className="badge badge-destructive">Urgent</span>;
    if (p === "HIGH") return <span className="badge badge-warning">High</span>;
    if (p === "NORMAL") return <span className="badge badge-primary">Normal</span>;
    return <span className="badge badge-info">Low</span>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Manage church announcements</p>
        </div>
        <Link href="/admin/announcements/new" className="btn btn-primary">+ New Announcement</Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">📢</span>
            <p className="font-medium">No announcements yet</p>
            <Link href="/admin/announcements/new" className="btn btn-primary mt-3">Create Announcement</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((a) => (
              <div key={a.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{a.title}</h4>
                      {priorityBadge(a.priority)}
                      {!a.isPublished && <span className="badge badge-info">Draft</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <button onClick={() => deleteAnnouncement(a.id)} className="btn btn-ghost text-destructive text-xs shrink-0">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
