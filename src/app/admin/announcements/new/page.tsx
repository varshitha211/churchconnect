"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    isPublished: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push("/admin/announcements");
    } catch { alert("Failed to create announcement"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold mb-4">New Announcement</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input type="text" className="input" placeholder="e.g., Easter Celebration" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea className="input min-h-[120px]" placeholder="Announcement details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="input" value={form.isPublished ? "published" : "draft"} onChange={(e) => setForm({ ...form, isPublished: e.target.value === "published" })}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Announcement"}</button>
          <button type="button" onClick={() => router.push("/admin/announcements")} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
