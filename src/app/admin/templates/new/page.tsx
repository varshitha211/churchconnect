"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: `🙏 Praise the Lord, {{member_name}}!

You are warmly invited to {{event_name}}, happening on {{event_dates}} at {{event_time}} at {{venue}}.

We would be blessed to have you with us!

View event details:
{{event_link}}`,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push("/admin/templates");
    } catch {
      alert("Failed to create template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold mb-4">New Message Template</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template Name *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Youth Conference Invitation"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subject (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="Subject line"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message Body *</label>
          <textarea
            className="input min-h-[200px] font-mono text-sm"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Variables: {"{{member_name}}"}, {"{{event_name}}"}, {"{{event_dates}}"}, {"{{event_time}}"}, {"{{venue}}"}, {"{{event_link}}"}, {"{{church_name}}"}
          </p>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Template"}
          </button>
          <button type="button" onClick={() => router.push("/admin/templates")} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
