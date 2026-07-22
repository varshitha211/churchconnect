"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSermonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    speaker: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    videoUrl: "",
    audioUrl: "",
    notesPdf: "",
    duration: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sermons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push("/admin/sermons");
    } catch { alert("Failed to create sermon"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold mb-4">New Sermon</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input type="text" className="input" placeholder="e.g., Walking in Faith" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Speaker *</label>
            <input type="text" className="input" placeholder="e.g., Pastor David" value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} required />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
            <input type="number" className="input" placeholder="e.g., 1800" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea className="input min-h-[80px]" placeholder="Brief description of the sermon..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Video URL</label>
          <input type="url" className="input" placeholder="https://youtube.com/watch?v=..." value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Audio URL</label>
          <input type="url" className="input" placeholder="https://..." value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes PDF URL</label>
          <input type="url" className="input" placeholder="https://..." value={form.notesPdf} onChange={(e) => setForm({ ...form, notesPdf: e.target.value })} />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Sermon"}</button>
          <button type="button" onClick={() => router.push("/admin/sermons")} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
