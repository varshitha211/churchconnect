"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  method: string;
  checkedInAt: string;
  member?: { fullName: string } | null;
}

interface AnalyticsData {
  eventId: string;
  eventName: string;
  totalInvited: number;
  notificationsSent: number;
  notificationsOpened: number;
  attending: number;
  maybe: number;
  notAttending: number;
  noResponse: number;
  callsAttempted: number;
  callsAnswered: number;
  callsNoAnswer: number;
  callsBusy: number;
  callsFailed: number;
  checkedIn: number;
  qrScanCount: number;
  manualCount: number;
  attendanceRecords: AttendanceRecord[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const [recipientsRes, rsvpsRes, attendanceRes, campaignsRes, commRes] = await Promise.all([
        fetch(`/api/events/${eventId}/recipients`),
        fetch(`/api/events/${eventId}/rsvps`),
        fetch(`/api/events/${eventId}/attendance`),
        fetch(`/api/events/${eventId}/campaigns`),
        fetch(`/api/events/${eventId}/communication-logs`),
      ]);

      const recipients = await recipientsRes.json();
      const rsvps = await rsvpsRes.json();
      const attendance = await attendanceRes.json();
      const campaigns = await campaignsRes.json();
      const comm = await commRes.json();

      const rsvpData = rsvps.data || [];
      const campData = campaigns.data || [];
      const commData = comm.data || [];
      const attendanceData: AttendanceRecord[] = attendance.data || [];

      setAnalytics({
        eventId,
        eventName: "",
        totalInvited: recipients.data?.length || 0,
        notificationsSent: commData.filter((c: { status: string }) => c.status === "SENT" || c.status === "DELIVERED").length,
        notificationsOpened: commData.filter((c: { status: string }) => c.status === "OPENED").length,
        attending: rsvpData.filter((r: { response: string }) => r.response === "ATTENDING").length,
        maybe: rsvpData.filter((r: { response: string }) => r.response === "MAYBE").length,
        notAttending: rsvpData.filter((r: { response: string }) => r.response === "NOT_ATTENDING").length,
        noResponse: (recipients.data?.length || 0) - rsvpData.length,
        callsAttempted: campData.reduce((sum: number, c: { totalCalls: number }) => sum + (c.totalCalls || 0), 0),
        callsAnswered: campData.reduce((sum: number, c: { answered: number }) => sum + (c.answered || 0), 0),
        callsNoAnswer: campData.reduce((sum: number, c: { noAnswer: number }) => sum + (c.noAnswer || 0), 0),
        callsBusy: campData.reduce((sum: number, c: { busy: number }) => sum + (c.busy || 0), 0),
        callsFailed: campData.reduce((sum: number, c: { failed: number }) => sum + (c.failed || 0), 0),
        checkedIn: attendanceData.length,
        qrScanCount: attendanceData.filter((a) => a.method === "QR_SCAN").length,
        manualCount: attendanceData.filter((a) => a.method === "MANUAL").length,
        attendanceRecords: attendanceData,
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  if (!analytics) {
    return <div className="text-center py-20"><p>Failed to load analytics</p></div>;
  }

  const statCards = [
    { label: "Total Invited", value: analytics.totalInvited, icon: "👥", color: "bg-primary/10 text-primary" },
    { label: "Checked In", value: analytics.checkedIn, icon: "📋", color: "bg-success/10 text-success" },
    { label: "Via QR Scan", value: analytics.qrScanCount, icon: "📱", color: "bg-info/10 text-info" },
    { label: "Manual Check-in", value: analytics.manualCount, icon: "✏️", color: "bg-warning/10 text-warning" },
    { label: "Attending (RSVP)", value: analytics.attending, icon: "✅", color: "bg-success/10 text-success" },
    { label: "Maybe", value: analytics.maybe, icon: "🤔", color: "bg-warning/10 text-warning" },
    { label: "Not Attending", value: analytics.notAttending, icon: "❌", color: "bg-destructive/10 text-destructive" },
    { label: "No Response", value: analytics.noResponse, icon: "⏳", color: "bg-muted text-muted-foreground" },
    { label: "Notifications Sent", value: analytics.notificationsSent, icon: "🔔", color: "bg-info/10 text-info" },
    { label: "Notifications Opened", value: analytics.notificationsOpened, icon: "👁️", color: "bg-success/10 text-success" },
    { label: "Calls Attempted", value: analytics.callsAttempted, icon: "📞", color: "bg-info/10 text-info" },
    { label: "Calls Answered", value: analytics.callsAnswered, icon: "🟢", color: "bg-success/10 text-success" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link href={`/admin/events/${eventId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold mt-1">Event Analytics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Breakdown */}
        <div className="card">
          <h3 className="font-semibold mb-3">Attendance Breakdown</h3>
          <div className="space-y-2">
            {[
              { label: "QR Scan", value: analytics.qrScanCount, total: analytics.checkedIn, color: "bg-info" },
              { label: "Manual Check-in", value: analytics.manualCount, total: analytics.checkedIn, color: "bg-success" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value} / {item.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {analytics.checkedIn > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {analytics.totalInvited > 0
                  ? `${Math.round((analytics.checkedIn / analytics.totalInvited) * 100)}% of invited members attended`
                  : "No invited members to compare against"}
              </p>
            </div>
          )}
        </div>

        {/* RSVP Breakdown */}
        <div className="card">
          <h3 className="font-semibold mb-3">RSVP Breakdown</h3>
          <div className="space-y-2">
            {[
              { label: "Attending", value: analytics.attending, total: analytics.totalInvited, color: "bg-success" },
              { label: "Maybe", value: analytics.maybe, total: analytics.totalInvited, color: "bg-warning" },
              { label: "Not Attending", value: analytics.notAttending, total: analytics.totalInvited, color: "bg-destructive" },
              { label: "No Response", value: analytics.noResponse, total: analytics.totalInvited, color: "bg-muted-foreground" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value} / {item.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Attendees */}
      {analytics.attendanceRecords.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">All Attendees ({analytics.attendanceRecords.length})</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Method</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.attendanceRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{r.member?.fullName || "—"}</td>
                    <td>
                      <span className={`badge ${r.method === "QR_SCAN" ? "badge-info" : "badge-success"}`}>
                        {r.method === "QR_SCAN" ? "📱 QR" : "✏️ Manual"}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {new Date(r.checkedInAt).toLocaleTimeString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
