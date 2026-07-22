"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Reading { id: string; date: string; book: string; chapter: number; verses?: string; notes?: string; }

const DAILY_VERSE = { text: "For where two or three gather in my name, there am I with them.", ref: "Matthew 18:20" };

export default function BiblePage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verses, setVerses] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/bible");
      const d = await res.json();
      if (d.success) setReadings(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const streak = (() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (readings.some((r) => new Date(r.date).toISOString().split("T")[0] === key)) count++;
      else break;
    }
    return count;
  })();

  async function submitReading() {
    if (!book.trim() || !chapter) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/member/bible", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, chapter: parseInt(chapter), verses, notes }),
      });
      if (res.ok) {
        toast.success("Reading logged!");
        setBook(""); setChapter(""); setVerses(""); setNotes(""); setShowForm(false); load();
      } else {
        toast.error("Failed to save reading");
      }
    } catch { toast.error("Something went wrong"); } finally { setSubmitting(false); }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const readToday = readings.some((r) => new Date(r.date).toISOString().split("T")[0] === todayStr);

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">Bible Reading</h2>
        <p className="text-sm text-muted-foreground">Daily verses and reading tracker</p>
      </div>

      {/* Daily Verse */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Verse of the Day</p>
        <p className="text-base font-medium italic leading-relaxed">&ldquo;{DAILY_VERSE.text}&rdquo;</p>
        <p className="text-sm text-primary font-semibold mt-2">— {DAILY_VERSE.ref}</p>
      </motion.div>

      {/* Streak */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card text-center">
          <p className="text-3xl font-bold text-primary">{streak}</p>
          <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
        </div>
        <div className="stat-card text-center">
          <p className={`text-3xl font-bold ${readToday ? "text-green-600" : "text-muted-foreground"}`}>{readToday ? "✓" : "—"}</p>
          <p className="text-xs text-muted-foreground">{readToday ? "Read Today" : "Not Yet"}</p>
        </div>
      </div>

      {/* Log Reading */}
      <button onClick={() => setShowForm(!showForm)} className="btn btn-primary w-full">
        {showForm ? "Cancel" : "Log Today's Reading"}
      </button>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3">
          <input className="input" placeholder="Book (e.g., John)" value={book} onChange={(e) => setBook(e.target.value)} />
          <input className="input" placeholder="Chapter" type="number" value={chapter} onChange={(e) => setChapter(e.target.value)} />
          <input className="input" placeholder="Verses (e.g., 1-10)" value={verses} onChange={(e) => setVerses(e.target.value)} />
          <textarea className="input min-h-[60px]" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={submitReading} disabled={!book.trim() || !chapter || submitting} className="btn btn-primary w-full">
            {submitting ? "Saving..." : "Save Reading"}
          </button>
        </motion.div>
      )}

      {/* History */}
      <div className="card">
        <h3 className="font-bold mb-3">Recent Readings</h3>
        {readings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No readings logged yet</p>
        ) : (
          <div className="space-y-2">
            {readings.slice(0, 14).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {new Date(r.date).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.book} {r.chapter}{r.verses ? `:${r.verses}` : ""}</p>
                  {r.notes && <p className="text-xs text-muted-foreground truncate">{r.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
