"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface LiveEvent {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  startTime: string;
  venue: string;
  status: string;
  qrAttendance: boolean;
  rsvpEnabled: boolean;
}

interface MemberInfo {
  id: string;
  fullName: string;
}

interface AttendanceRecord {
  id: string;
  checkedInAt: string;
  method: string;
  eventId: string;
}

export default function AttendancePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [checkedInEvents, setCheckedInEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const scannerRef = useRef<unknown>(null);
  const scanCooldown = useRef(false);

  const load = useCallback(async () => {
    try {
      const [eventsRes, attRes, profileRes] = await Promise.all([
        fetch("/api/events/public"),
        fetch("/api/member/attendance"),
        fetch("/api/member/profile"),
      ]);
      const eventsData = await eventsRes.json();
      const attData = await attRes.json();
      const profileData = await profileRes.json();

      if (profileData.success) {
        setMember({ id: profileData.data.id, fullName: profileData.data.fullName });
      }

      if (eventsData.success) {
        const liveEvents = eventsData.data.filter((e: LiveEvent) => e.status === "LIVE");
        setEvents(liveEvents);
      }

      if (attData.success) {
        const checked = new Set<string>();
        attData.data.monthAttendance.forEach((r: AttendanceRecord) => {
          checked.add(r.eventId);
        });
        setCheckedInEvents(checked);
      }
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => { load(); }, 15000);
    const onFocus = () => { load(); };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  async function startScanner(eventId: string) {
    setScanning(eventId);
    setScanResult(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-scanner-region");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          if (scanCooldown.current) return;
          scanCooldown.current = true;
          setTimeout(() => { scanCooldown.current = false; }, 3000);
          try {
            const isVenueQr = decodedText.startsWith("event:");
            const payload: Record<string, string> = { token: decodedText };

            if (isVenueQr && member) {
              payload.memberId = member.id;
            }

            const res = await fetch(`/api/qr/scan`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
              setScanResult({ ok: true, msg: "Attendance marked!" });
              setCheckedInEvents((prev) => new Set([...prev, eventId]));
              toast.success("Attendance marked!");
            } else {
              setScanResult({ ok: false, msg: data.error || "Check-in failed" });
              toast.error(data.error || "Check-in failed");
            }
          } catch {
            setScanResult({ ok: false, msg: "Network error" });
            toast.error("Network error");
          }
          stopScanner();
        },
        () => {}
      );
    } catch {
      setScanResult({ ok: false, msg: "Camera not available" });
      setScanning(null);
    }
  }

  function stopScanner() {
    if (scannerRef.current) {
      (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
      (scannerRef.current as { clear: () => void }).clear();
      scannerRef.current = null;
    }
    setScanning(null);
  }

  function getMemberQrUrl(eventId: string) {
    if (!member) return "";
    const token = `${member.id}:${eventId}`;
    return `${window.location.origin}/scan?token=${encodeURIComponent(token)}`;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">Attendance</h2>
        <p className="text-sm text-muted-foreground">Check in to live church events</p>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl block mb-3">📅</span>
          <p className="font-semibold">No Live Events</p>
          <p className="text-sm text-muted-foreground mt-1">
            Check back when an event is active
          </p>
        </div>
      ) : (
        events.map((event, i) => {
          const attended = checkedInEvents.has(event.id);
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-glow" />
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">
                      {event.status === "LIVE" ? "Live" : "Open"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{event.name}</h3>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <p>
                  📅{" "}
                  {new Date(event.startDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p>⏰ {event.startTime}</p>
                <p>📍 {event.venue}</p>
              </div>

              {attended ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm font-semibold">Attendance Marked</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => startScanner(event.id)}
                    className="btn btn-primary flex-1"
                  >
                    Scan QR Code
                  </button>
                  <button
                    onClick={() =>
                      setShowQr(showQr === event.id ? null : event.id)
                    }
                    className="btn btn-secondary flex-1"
                  >
                    Show My QR
                  </button>
                </div>
              )}

              {showQr === event.id && member && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 text-center p-4 bg-muted rounded-xl"
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    Show this QR code to a volunteer at the venue
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getMemberQrUrl(event.id))}`}
                    alt="My QR Code"
                    className="mx-auto rounded-lg"
                    width={180}
                    height={180}
                  />
                  <p className="text-xs font-medium mt-2">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.name}
                  </p>
                </motion.div>
              )}

              {scanning === event.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3"
                >
                  <div
                    id="qr-scanner-region"
                    className="rounded-xl overflow-hidden"
                  />
                  <button
                    onClick={stopScanner}
                    className="btn btn-destructive w-full mt-2"
                  >
                    Stop Scanner
                  </button>
                </motion.div>
              )}

              {scanResult && (
                <div
                  className={`mt-3 p-3 rounded-xl text-sm font-medium ${scanResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                >
                  {scanResult.ok ? "✅ " : "❌ "}
                  {scanResult.msg}
                </div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
