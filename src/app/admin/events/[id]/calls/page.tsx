"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalCalls: number;
  answered: number;
  noAnswer: number;
  busy: number;
  failed: number;
  startedAt?: string;
  completedAt?: string;
}

export default function CallsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/campaigns`);
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  async function createCampaign() {
    setCreating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName || `Call Campaign ${new Date().toLocaleDateString()}`,
          maxRetries: 2,
          retryDelayMin: 30,
        }),
      });
      if (res.ok) {
        setCampaignName("");
        loadCampaigns();
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <Link href={`/admin/events/${eventId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold mt-1">Voice Call Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Create mock calling campaigns to simulate automated phone calls
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">New Campaign</h3>
        <p className="text-sm text-muted-foreground">
          In mock mode, calls are simulated with random statuses (Answered, No Answer, Busy, Failed).
          No real calls are placed.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Campaign name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
          <button
            onClick={createCampaign}
            disabled={creating}
            className="btn btn-primary"
          >
            {creating ? "Running..." : "Start Mock Campaign"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">📞</span>
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm text-muted-foreground">Start a mock campaign to see results</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{c.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {c.startedAt && new Date(c.startedAt).toLocaleString()}
                  </p>
                </div>
                <span className={`badge ${c.status === "COMPLETED" ? "badge-success" : c.status === "RUNNING" ? "badge-info" : "badge-warning"}`}>
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="p-2 bg-muted rounded">
                  <p className="font-bold">{c.totalCalls}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-2 bg-success/10 rounded">
                  <p className="font-bold text-success">{c.answered}</p>
                  <p className="text-xs text-muted-foreground">Answered</p>
                </div>
                <div className="p-2 bg-warning/10 rounded">
                  <p className="font-bold text-warning">{c.noAnswer}</p>
                  <p className="text-xs text-muted-foreground">No Answer</p>
                </div>
                <div className="p-2 bg-info/10 rounded">
                  <p className="font-bold text-info">{c.busy}</p>
                  <p className="text-xs text-muted-foreground">Busy</p>
                </div>
                <div className="p-2 bg-destructive/10 rounded">
                  <p className="font-bold text-destructive">{c.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
