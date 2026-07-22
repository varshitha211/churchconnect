"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface SermonData {
  id: string; title: string; speaker: string; date: string; description?: string;
  videoUrl?: string; audioUrl?: string; notesPdf?: string; duration?: number;
  bookmarks: unknown[];
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<SermonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/sermons");
      const d = await res.json();
      if (d.success) setSermons(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = sermons.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.speaker.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="space-y-4 animate-fade-in">{[1,2,3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">Sermons</h2>
        <p className="text-sm text-muted-foreground">Watch, listen, and read sermon notes</p>
      </div>

      <input className="input" placeholder="Search by title or speaker..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">🎬</span>
          <p className="font-semibold">{search ? "No sermons found" : "No Sermons Yet"}</p>
          <p className="text-sm text-muted-foreground mt-1">Sermons will appear here once published</p>
        </div>
      ) : (
        filtered.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                🎤
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.speaker} · {new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</p>
                {s.duration && <p className="text-xs text-muted-foreground">{Math.floor(s.duration / 60)}m {s.duration % 60}s</p>}
                {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
                <div className="flex gap-2 mt-2">
                  {s.videoUrl && <a href={s.videoUrl} target="_blank" rel="noopener" className="btn btn-primary btn-sm text-xs">▶ Watch</a>}
                  {s.audioUrl && <a href={s.audioUrl} target="_blank" rel="noopener" className="btn btn-secondary btn-sm text-xs">🎧 Listen</a>}
                  {s.notesPdf && <a href={s.notesPdf} target="_blank" rel="noopener" className="btn btn-secondary btn-sm text-xs">📄 Notes</a>}
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
