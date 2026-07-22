"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

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
  rsvpEnabled: boolean;
  voiceEnabled: boolean;
  rsvpCounts: { attending: number; maybe: number; notAttending: number };
}

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rsvpResponse, setRsvpResponse] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [prayerRequest, setPrayerRequest] = useState("");
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpResult, setRsvpResult] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const loadEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/public/${slug}`);
      if (!res.ok) { setNotFound(true); return; }
      const data = await res.json();
      if (data.success) setEvent(data.data);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  function playVoiceAnnouncement() {
    if (!event) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const dateStr = new Date(event.startDate).toLocaleDateString("en-IN", {
        month: "long", day: "numeric",
      });
      const endDateStr = event.endDate
        ? ` and ${new Date(event.endDate).toLocaleDateString("en-IN", { month: "long", day: "numeric" })}`
        : "";

      const text = `Praise the Lord! You are warmly invited to ${event.name}, happening on ${dateStr}${endDateStr} at ${event.startTime} at ${event.venue}. We would be blessed to have you with us. Thank you.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }

  function stopVoice() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }

  async function submitRsvp() {
    if (!rsvpResponse) { setRsvpResult("Please select your response"); return; }
    setRsvpSubmitting(true);
    try {
      const res = await fetch(`/api/events/public/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: rsvpResponse,
          guestName: guestName || undefined,
          memberPhone: guestPhone || undefined,
          guestCount,
          prayerRequest: prayerRequest || undefined,
          message: rsvpMessage || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRsvpResult(data.updated ? "Your RSVP has been updated!" : "Thank you for your RSVP! 🙏");
        loadEvent();
      } else {
        setRsvpResult(data.error || "Failed to submit RSVP");
      }
    } catch {
      setRsvpResult("Something went wrong");
    } finally {
      setRsvpSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">🔍</span>
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-muted-foreground">This event may not exist or is still being prepared.</p>
        </div>
      </div>
    );
  }

  const dateRange = event.endDate
    ? `${new Date(event.startDate).toLocaleDateString("en-IN", { month: "long", day: "numeric" })} – ${new Date(event.endDate).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}`
    : new Date(event.startDate).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
            S
          </div>
          <p className="text-sm font-medium text-primary">Sion Holy Church</p>
        </div>

        <div className="card space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>📅 {dateRange}</p>
              <p>⏰ {event.startTime}</p>
              <p>📍 {event.venue}</p>
            </div>
          </div>

          {event.description && (
            <p className="text-sm">{event.description}</p>
          )}

          {event.locationLink && (
            <a
              href={event.locationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full text-sm"
            >
              📍 View on Google Maps
            </a>
          )}

          {event.voiceEnabled && (
            <div className="flex gap-2">
              <button
                onClick={speaking ? stopVoice : playVoiceAnnouncement}
                className={`btn flex-1 ${speaking ? "btn-destructive" : "btn-secondary"}`}
              >
                {speaking ? "⏹ Stop" : "🔊 Listen to Announcement"}
              </button>
            </div>
          )}

          {event.rsvpEnabled && (
            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="font-semibold">RSVP</h3>

              <div className="grid grid-cols-3 gap-2">
                {(["ATTENDING", "MAYBE", "NOT_ATTENDING"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRsvpResponse(r)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      rsvpResponse === r
                        ? r === "ATTENDING"
                          ? "bg-success/10 border-success text-success"
                          : r === "MAYBE"
                          ? "bg-warning/10 border-warning text-warning"
                          : "bg-destructive/10 border-destructive text-destructive"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {r === "ATTENDING" ? "✅ Attending" : r === "MAYBE" ? "🤔 Maybe" : "❌ Can't Make It"}
                  </button>
                ))}
              </div>

              {rsvpResponse && (
                <div className="space-y-3 animate-fade-in">
                  <input
                    type="text"
                    className="input"
                    placeholder="Your name (optional)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                  <input
                    type="tel"
                    className="input"
                    placeholder="Your phone (to track your RSVP)"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                  <div>
                    <label className="text-sm text-muted-foreground">Number of guests</label>
                    <input
                      type="number"
                      className="input"
                      min={0}
                      max={20}
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <textarea
                    className="input min-h-[60px]"
                    placeholder="Prayer request (optional)"
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                  />
                  <textarea
                    className="input min-h-[60px]"
                    placeholder="Message to organizer (optional)"
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                  />
                  <button
                    onClick={submitRsvp}
                    className="btn btn-primary w-full"
                    disabled={rsvpSubmitting}
                  >
                    {rsvpSubmitting ? "Submitting..." : "Submit RSVP"}
                  </button>
                </div>
              )}

              {rsvpResult && (
                <p className={`text-sm text-center font-medium ${rsvpResult.includes("Thank") ? "text-success" : "text-destructive"}`}>
                  {rsvpResult}
                </p>
              )}

              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <span>✅ {event.rsvpCounts.attending} attending</span>
                <span>🤔 {event.rsvpCounts.maybe} maybe</span>
                <span>❌ {event.rsvpCounts.notAttending} can't</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
