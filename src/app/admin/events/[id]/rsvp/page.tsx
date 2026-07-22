"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Rsvp {
  id: string;
  response: string;
  guestName?: string;
  guestCount: number;
  prayerRequest?: string;
  message?: string;
  createdAt: string;
  member?: { fullName: string; phone: string } | null;
}

export default function RsvpPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRsvps = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvps`);
      const data = await res.json();
      if (data.success) setRsvps(data.data);
    } catch (error) {
      console.error("Failed to load RSVPs:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadRsvps(); }, [loadRsvps]);

  const attending = rsvps.filter((r) => r.response === "ATTENDING");
  const maybe = rsvps.filter((r) => r.response === "MAYBE");
  const notAttending = rsvps.filter((r) => r.response === "NOT_ATTENDING");

  function responseBadge(r: string) {
    if (r === "ATTENDING") return <span className="badge badge-success">Attending</span>;
    if (r === "MAYBE") return <span className="badge badge-warning">Maybe</span>;
    return <span className="badge badge-destructive">Not Attending</span>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <Link href={`/admin/events/${eventId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold mt-1">RSVP Responses</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-success">{attending.length}</p>
          <p className="text-xs text-muted-foreground">Attending</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-warning">{maybe.length}</p>
          <p className="text-xs text-muted-foreground">Maybe</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-destructive">{notAttending.length}</p>
          <p className="text-xs text-muted-foreground">Not Attending</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : rsvps.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">✍️</span>
          <p className="font-medium">No RSVPs yet</p>
          <p className="text-sm text-muted-foreground">
            Share the event link to collect RSVPs
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Response</th>
                <th>Guests</th>
                <th className="hidden md:table-cell">Prayer Request</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">
                    {r.member?.fullName || r.guestName || "Anonymous"}
                  </td>
                  <td>{responseBadge(r.response)}</td>
                  <td>{r.guestCount || "—"}</td>
                  <td className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                    {r.prayerRequest || "—"}
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
