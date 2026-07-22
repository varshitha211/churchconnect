"use client";

import { useEffect, useState, useCallback } from "react";

interface FollowUp {
  id: string;
  reason: string;
  status: string;
  notes?: string;
  createdAt: string;
  member: { fullName: string; phone: string };
  event: { name: string };
}

export default function FollowUpPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFollowUps = useCallback(async () => {
    try {
      const res = await fetch("/api/follow-ups");
      const data = await res.json();
      if (data.success) setFollowUps(data.data);
    } catch (error) {
      console.error("Failed to load follow-ups:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFollowUps(); }, [loadFollowUps]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/follow-ups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadFollowUps();
  }

  function reasonBadge(r: string) {
    const map: Record<string, string> = {
      NO_RSVP: "badge-warning",
      UNANSWERED_CALL: "badge-destructive",
      NOT_OPENED: "badge-info",
      NOT_SUBSCRIBED: "badge-warning",
    };
    return <span className={`badge ${map[r] || "badge-info"}`}>{r.replace(/_/g, " ")}</span>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Follow-Up List</h1>
        <p className="text-sm text-muted-foreground">
          Members who may need personal outreach
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">✅</span>
            <p className="font-medium">No pending follow-ups</p>
            <p className="text-sm text-muted-foreground">Everyone is contacted!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {followUps.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {f.member.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.member.fullName}</p>
                    <p className="text-xs text-muted-foreground">{f.member.phone} · {f.event.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reasonBadge(f.reason)}
                  <select
                    className="input text-xs py-1 w-auto"
                    value={f.status}
                    onChange={(e) => updateStatus(f.id, e.target.value)}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
