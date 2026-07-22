"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Prayer {
  id: string; title: string; description?: string; isAnonymous: boolean;
  status: string; prayerCount: number; createdAt: string;
}

export default function PrayerPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [anon, setAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/prayer");
      const d = await res.json();
      if (d.success) setPrayers(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/member/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, isAnonymous: anon }),
      });
      if (res.ok) {
        toast.success("Prayer request submitted!");
        setTitle(""); setDesc(""); setAnon(false); setShowForm(false); load();
      } else {
        toast.error("Failed to submit prayer request");
      }
    } catch { toast.error("Something went wrong"); } finally { setSubmitting(false); }
  }

  const statusBadge = (s: string) => {
    if (s === "ACTIVE") return <span className="badge badge-primary">Active</span>;
    if (s === "ANSWERED") return <span className="badge badge-success">Answered</span>;
    return <span className="badge badge-info">Archived</span>;
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Prayer Requests</h2>
          <p className="text-sm text-muted-foreground">Submit and track prayer requests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          {showForm ? "Cancel" : "+ New Request"}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3">
          <input className="input" placeholder="Prayer request title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input min-h-[80px]" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="rounded" />
            Submit anonymously
          </label>
          <button onClick={submit} disabled={!title.trim() || submitting} className="btn btn-primary w-full">
            {submitting ? "Submitting..." : "Submit Prayer Request"}
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : prayers.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">🙏</span>
          <p className="font-semibold">No Prayer Requests</p>
          <p className="text-sm text-muted-foreground mt-1">Submit your first prayer request above</p>
        </div>
      ) : (
        prayers.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm">{p.isAnonymous ? "Anonymous" : "Your Request"}</h3>
              {statusBadge(p.status)}
            </div>
            <p className="font-medium mb-1">{p.title}</p>
            {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>🙏 {p.prayerCount} praying</span>
              <span>{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
