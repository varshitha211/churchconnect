"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  subject?: string;
  body: string;
  isDefault: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    loadTemplates();
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Message Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable invitation message templates</p>
        </div>
        <Link href="/admin/templates/new" className="btn btn-primary">+ New Template</Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">📝</span>
            <p className="font-medium">No templates yet</p>
            <Link href="/admin/templates/new" className="btn btn-primary mt-3">Create Template</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{t.name}</h4>
                      {t.isDefault && <span className="badge badge-primary">Default</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.subject && `${t.subject} · `}{t.body.slice(0, 80)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="btn btn-ghost text-destructive text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
