"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";

interface EventData {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  venue: string;
  locationLink?: string;
  organizerContact?: string;
  status: string;
  voiceEnabled: boolean;
  rsvpEnabled: boolean;
  qrAttendance: boolean;
  registrationReq: boolean;
  _count: { recipients: number; rsvps: number; attendance: number };
}

interface AttendanceRecord {
  id: string;
  checkedInAt: string;
  method: string;
  member?: { fullName: string; phone: string } | null;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then((data) => { if (data.success) setEvent(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`/api/events/${id}/attendance`)
      .then((res) => res.json())
      .then((data) => { if (data.success) setAttendanceRecords(data.data || []); })
      .catch(() => {});
  }, [id]);

  async function updateStatus(status: string) {
    const res = await fetch(`/api/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setEvent((prev) => (prev ? { ...prev, status } : prev));
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="font-medium">Event not found</p>
        <Link href="/admin/events" className="btn btn-primary mt-4">← Back to Events</Link>
      </div>
    );
  }

  const statusBadge: Record<string, string> = {
    DRAFT: "badge-warning",
    PUBLISHED: "badge-success",
    LIVE: "badge-success animate-pulse",
    CANCELLED: "badge-destructive",
    COMPLETED: "badge-info",
  };

  const qrCount = attendanceRecords.filter((r) => r.method === "QR_SCAN").length;
  const manualCount = attendanceRecords.filter((r) => r.method === "MANUAL").length;
  const recentAttendees = attendanceRecords.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground mb-1 inline-block">
            ← Events
          </Link>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${statusBadge[event.status] || "badge-info"}`}>{event.status}</span>
            <span className="text-sm text-muted-foreground">
              {CATEGORY_LABELS[event.category] || event.category}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {event.status === "DRAFT" && (
            <button onClick={() => updateStatus("PUBLISHED")} className="btn btn-primary">
              Publish
            </button>
          )}
          {event.status === "PUBLISHED" && (
            <button onClick={() => updateStatus("LIVE")} className="btn btn-success">
              Go Live
            </button>
          )}
          {event.status === "LIVE" && (
            <button onClick={() => updateStatus("COMPLETED")} className="btn btn-secondary">
              End Event
            </button>
          )}
          {event.status === "PUBLISHED" && (
            <button onClick={() => updateStatus("COMPLETED")} className="btn btn-secondary">
              Mark Complete
            </button>
          )}
          <Link href={`/admin/events/${id}/invite`} className="btn btn-secondary">
            Invite Members
          </Link>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Attendance Summary</h3>
          <Link href={`/admin/events/${id}/attendance`} className="text-sm text-primary hover:underline">
            Manage Attendance →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 bg-muted rounded-xl">
            <p className="text-2xl font-bold text-primary">{event._count.attendance}</p>
            <p className="text-xs text-muted-foreground">Total Checked In</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{qrCount}</p>
            <p className="text-xs text-muted-foreground">Via QR Scan</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-xl">
            <p className="text-2xl font-bold text-green-600">{manualCount}</p>
            <p className="text-xs text-muted-foreground">Manual Check-in</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-xl">
            <p className="text-2xl font-bold text-orange-600">{event._count.rsvps}</p>
            <p className="text-xs text-muted-foreground">RSVPs</p>
          </div>
        </div>

        {recentAttendees.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Recent Check-ins</p>
            <div className="space-y-1">
              {recentAttendees.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{r.member?.fullName || "—"}</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${r.method === "QR_SCAN" ? "badge-info" : "badge-success"}`}>
                      {r.method === "QR_SCAN" ? "📱 QR" : "✏️ Manual"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {attendanceRecords.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card space-y-3">
          <h3 className="font-semibold">Event Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">
                {new Date(event.startDate).toLocaleDateString("en-IN", {
                  year: "numeric", month: "long", day: "numeric",
                })}
                {event.endDate && ` – ${new Date(event.endDate).toLocaleDateString("en-IN", { month: "long", day: "numeric" })}`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-medium">{event.startTime}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Venue</p>
              <p className="font-medium">{event.venue}</p>
            </div>
            {event.organizerContact && (
              <div>
                <p className="text-muted-foreground">Organizer</p>
                <p className="font-medium">{event.organizerContact}</p>
              </div>
            )}
          </div>
          {event.description && (
            <div>
              <p className="text-muted-foreground text-sm">Description</p>
              <p className="text-sm mt-1">{event.description}</p>
            </div>
          )}
          {event.locationLink && (
            <a
              href={event.locationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on Google Maps →
            </a>
          )}
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold">Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invited</span>
              <span className="font-semibold">{event._count.recipients}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">RSVPs</span>
              <span className="font-semibold">{event._count.rsvps}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Attended</span>
              <span className="font-semibold">{event._count.attendance}</span>
            </div>
          </div>
          <hr className="border-border" />
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className={event.rsvpEnabled ? "text-success" : "text-muted-foreground"}>
                {event.rsvpEnabled ? "✓" : "✗"}
              </span>
              <span>RSVP {event.rsvpEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={event.qrAttendance ? "text-success" : "text-muted-foreground"}>
                {event.qrAttendance ? "✓" : "✗"}
              </span>
              <span>QR Attendance {event.qrAttendance ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={event.voiceEnabled ? "text-success" : "text-muted-foreground"}>
                {event.voiceEnabled ? "✓" : "✗"}
              </span>
              <span>Voice Announcement {event.voiceEnabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href={`/admin/events/${id}/invite`} className="card text-center py-4 hover:bg-muted transition-colors">
          <span className="text-2xl block">📨</span>
          <p className="text-sm font-medium mt-1">Invite</p>
        </Link>
        <Link href={`/admin/events/${id}/calls`} className="card text-center py-4 hover:bg-muted transition-colors">
          <span className="text-2xl block">📞</span>
          <p className="text-sm font-medium mt-1">Calls</p>
        </Link>
        <Link href={`/admin/events/${id}/rsvp`} className="card text-center py-4 hover:bg-muted transition-colors">
          <span className="text-2xl block">✍️</span>
          <p className="text-sm font-medium mt-1">RSVP</p>
        </Link>
        <Link href={`/admin/events/${id}/attendance`} className="card text-center py-4 hover:bg-muted transition-colors">
          <span className="text-2xl block">📋</span>
          <p className="text-sm font-medium mt-1">Attendance</p>
        </Link>
      </div>
    </div>
  );
}
