"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    venue: "",
    locationLink: "",
    organizerContact: "",
    registrationReq: false,
    voiceEnabled: true,
    rsvpEnabled: true,
    qrAttendance: true,
    status: "DRAFT",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.category || !form.startDate || !form.startTime || !form.venue) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create event");
        return;
      }

      router.push(`/admin/events/${data.data.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Create Event</h1>
        <p className="text-sm text-muted-foreground">Set up a new church event</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Event Name *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Ablaze 2026, Sunday Service"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            required
          >
            <option value="">Select category</option>
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="input min-h-[80px]"
            placeholder="Event description..."
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              className="input"
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time *</label>
            <input
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => updateField("startTime", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Publish Now</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Venue *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Sion Holy Church Auditorium"
            value={form.venue}
            onChange={(e) => updateField("venue", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location Link (Google Maps)</label>
          <input
            type="url"
            className="input"
            placeholder="https://maps.google.com/..."
            value={form.locationLink}
            onChange={(e) => updateField("locationLink", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Organizer Contact</label>
          <input
            type="text"
            className="input"
            placeholder="Contact name or phone"
            value={form.organizerContact}
            onChange={(e) => updateField("organizerContact", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Features</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.rsvpEnabled} onChange={(e) => updateField("rsvpEnabled", e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">Enable RSVP</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.qrAttendance} onChange={(e) => updateField("qrAttendance", e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">Enable QR Code Attendance</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.voiceEnabled} onChange={(e) => updateField("voiceEnabled", e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm">Enable Voice Announcement</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Event"}
          </button>
          <button type="button" onClick={() => router.push("/admin/events")} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
