"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  description?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  _count: { bookmarks: number };
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sermons");
      const data = await res.json();
      if (data.success) setSermons(data.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteSermon(id: string) {
    if (!confirm("Delete this sermon?")) return;
    await fetch(`/api/admin/sermons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sermons</h1>
          <p className="text-sm text-muted-foreground">Manage sermon recordings and notes</p>
        </div>
        <Link href="/admin/sermons/new" className="btn btn-primary">+ New Sermon</Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : sermons.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">🎬</span>
            <p className="font-medium">No sermons yet</p>
            <Link href="/admin/sermons/new" className="btn btn-primary mt-3">Add Sermon</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sermons.map((s) => (
              <div key={s.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{s.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.speaker} · {new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</p>
                    {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      {s.duration && <span>{Math.floor(s.duration / 60)}m {s.duration % 60}s</span>}
                      {s._count.bookmarks > 0 && <span>{s._count.bookmarks} bookmarks</span>}
                      {s.videoUrl && <span className="text-success">Has video</span>}
                      {s.audioUrl && <span className="text-primary">Has audio</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteSermon(s.id)} className="btn btn-ghost text-destructive text-xs shrink-0">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
