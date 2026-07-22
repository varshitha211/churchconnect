"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

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
  status: string;
  rsvpEnabled: boolean;
  rsvpCounts: { attending: number; maybe: number; notAttending: number };
}

export default function EventsListPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events/public");
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const upcomingEvents = events.filter((e) => new Date(e.startDate) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.startDate) < new Date());

  function eventDate(e: EventData) {
    const start = new Date(e.startDate).toLocaleDateString("en-IN", {
      month: "short", day: "numeric", year: "numeric",
    });
    if (e.endDate) {
      const end = new Date(e.endDate).toLocaleDateString("en-IN", {
        month: "short", day: "numeric",
      });
      return `${start} – ${end}`;
    }
    return start;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold">Sion Holy Church</h1>
          <p className="text-sm text-muted-foreground mt-1">Events & Programs</p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <Link href="/login" className="btn btn-secondary text-sm">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-primary text-sm">
            Register
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📅</span>
            <h2 className="text-xl font-bold mb-2">No Events Yet</h2>
            <p className="text-muted-foreground">Check back soon for upcoming events and programs.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3">Upcoming Events</h2>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/event/${event.slug}`}
                      className="card block hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{event.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            📅 {eventDate(event)} · ⏰ {event.startTime}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            📍 {event.venue}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        {event.rsvpEnabled && (
                          <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                            <span className="block text-success font-medium">
                              {event.rsvpCounts.attending} attending
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 text-muted-foreground">Past Events</h2>
                <div className="space-y-3">
                  {pastEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/event/${event.slug}`}
                      className="card block opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        📅 {eventDate(event)} · ⏰ {event.startTime} · 📍 {event.venue}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
