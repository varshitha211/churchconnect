"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardStats } from "@/types";

const statCards = [
  { key: "totalMembers", label: "Total Members", icon: "👥", color: "bg-primary/10 text-primary" },
  { key: "activeEvents", label: "Active Events", icon: "📅", color: "bg-info/10 text-info" },
  { key: "upcomingEvents", label: "Upcoming Events", icon: "⏰", color: "bg-warning/10 text-warning" },
  { key: "notificationsSent", label: "Notifications Sent", icon: "🔔", color: "bg-success/10 text-success" },
  { key: "notificationsOpened", label: "Notifications Opened", icon: "👁️", color: "bg-accent/10 text-accent" },
  { key: "whatsappPrepared", label: "WhatsApp Prepared", icon: "💬", color: "bg-success/10 text-success" },
  { key: "totalCalls", label: "Total Calls", icon: "📞", color: "bg-info/10 text-info" },
  { key: "callsAnswered", label: "Calls Answered", icon: "✅", color: "bg-success/10 text-success" },
  { key: "callsNoAnswer", label: "Calls No Answer", icon: "📵", color: "bg-warning/10 text-warning" },
  { key: "callsBusy", label: "Calls Busy", icon: "🔴", color: "bg-destructive/10 text-destructive" },
  { key: "callsFailed", label: "Calls Failed", icon: "⚠️", color: "bg-destructive/10 text-destructive" },
  { key: "totalRsvp", label: "Total RSVPs", icon: "✍️", color: "bg-primary/10 text-primary" },
  { key: "totalAttendance", label: "Total Attendance", icon: "📋", color: "bg-success/10 text-success" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your church communication
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/events/new" className="btn btn-primary">
            + New Event
          </Link>
          <Link href="/admin/members/import" className="btn btn-secondary">
            Import Members
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <div key={card.key} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats ? (stats as unknown as Record<string, number>)[card.key] || 0 : 0}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/admin/events/new" className="block p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="text-sm font-medium">Create New Event</p>
                  <p className="text-xs text-muted-foreground">Set up an upcoming church event</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/members" className="block p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">👥</span>
                <div>
                  <p className="text-sm font-medium">Manage Members</p>
                  <p className="text-xs text-muted-foreground">Add, edit, or import church members</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/follow-up" className="block p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <p className="text-sm font-medium">Follow-Up List</p>
                  <p className="text-xs text-muted-foreground">Members needing personal outreach</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Getting Started</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <span className="text-success mt-0.5">✅</span>
              <div>
                <p className="font-medium">1. Add Members</p>
                <p className="text-xs text-muted-foreground">Import your church contacts via CSV or add them manually</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-success mt-0.5">✅</span>
              <div>
                <p className="font-medium">2. Create an Event</p>
                <p className="text-xs text-muted-foreground">Set up your first church event with all details</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-muted-foreground/40 mt-0.5">3</span>
              <div>
                <p className="font-medium">3. Send Notifications</p>
                <p className="text-xs text-muted-foreground">Generate invitations and notify members via push, WhatsApp, or calls</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-muted-foreground/40 mt-0.5">4</span>
              <div>
                <p className="font-medium">4. Track &amp; Analyze</p>
                <p className="text-xs text-muted-foreground">Monitor RSVPs, attendance, and communication status</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
