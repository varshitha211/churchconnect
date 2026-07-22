"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";

interface EventItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  startDate: string;
  startTime: string;
  venue: string;
  status: string;
  _count: { recipients: number; rsvps: number; attendance: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    try {
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { setPage(1); }, [search, status]);

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      DRAFT: "badge-warning",
      PUBLISHED: "badge-success",
      CANCELLED: "badge-destructive",
      COMPLETED: "badge-info",
    };
    return <span className={`badge ${map[s] || "badge-info"}`}>{s}</span>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">Manage church events</p>
        </div>
        <Link href="/admin/events/new" className="btn btn-primary">+ New Event</Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">📅</span>
            <p className="font-medium">No events found</p>
            <Link href="/admin/events/new" className="btn btn-primary mt-4">+ Create Event</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{event.name}</h3>
                      {statusBadge(event.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORY_LABELS[event.category] || event.category} · {event.venue}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startDate).toLocaleDateString("en-IN", {
                        year: "numeric", month: "short", day: "numeric",
                      })} at {event.startTime}
                    </p>
                  </div>
                  <div className="flex gap-4 text-center text-xs text-muted-foreground shrink-0">
                    <div>
                      <p className="font-semibold text-foreground">{event._count.recipients}</p>
                      <p>Invited</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{event._count.rsvps}</p>
                      <p>RSVP</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{event._count.attendance}</p>
                      <p>Attended</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn btn-secondary">Previous</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn btn-secondary">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
