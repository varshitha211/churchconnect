"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface AttendanceRecord {
  id: string;
  checkedInAt: string;
  method: string;
  member?: { fullName: string; phone: string } | null;
}

interface QrCodeItem {
  id: string;
  token: string;
  isCheckedIn: boolean;
  member?: { id: string; fullName: string; phone: string } | null;
}

interface Member {
  id: string;
  fullName: string;
  phone: string;
}

export default function AttendancePage() {
  const params = useParams();
  const eventId = params.id as string;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"checkin" | "qrcodes">("checkin");
  const [generatingQr, setGeneratingQr] = useState(false);

  const [activeOption, setActiveOption] = useState<"scan" | "showqr" | "manual" | null>(null);
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const scannerRef = useRef<unknown>(null);
  const scanCooldown = useRef(false);

  const loadAttendance = useCallback(async () => {
    try {
      const [attRes, qrRes, memRes] = await Promise.all([
        fetch(`/api/events/${eventId}/attendance`),
        fetch(`/api/events/${eventId}/qr`),
        fetch("/api/members?per_page=1000"),
      ]);
      const attData = await attRes.json();
      const qrData = await qrRes.json();
      const memData = await memRes.json();
      if (attData.success) setRecords(attData.data);
      if (qrData.success) setQrCodes(qrData.data);
      if (memData.success) setAllMembers(memData.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  async function startCameraScan() {
    setCameraActive(true);
    setScanResult(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("admin-qr-scanner");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          if (scanCooldown.current) return;
          scanCooldown.current = true;
          setTimeout(() => { scanCooldown.current = false; }, 2000);

          try {
            const res = await fetch(`/api/events/${eventId}/qr/scan`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: decodedText }),
            });
            const data = await res.json();
            if (data.success) {
              setScanResult({ ok: true, msg: `Attendance marked for ${data.memberName}` });
              loadAttendance();
            } else {
              setScanResult({ ok: false, msg: data.error || "Check-in failed" });
            }
          } catch {
            setScanResult({ ok: false, msg: "Network error during check-in" });
          }
        },
        () => {}
      );
    } catch {
      setScanResult({ ok: false, msg: "Camera not available or access denied" });
      setCameraActive(false);
    }
  }

  function stopCameraScan() {
    if (scannerRef.current) {
      (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
      (scannerRef.current as { clear: () => void }).clear();
      scannerRef.current = null;
    }
    setCameraActive(false);
  }

  function handleOptionClick(option: "scan" | "showqr" | "manual") {
    if (activeOption === option) {
      if (option === "scan") stopCameraScan();
      setActiveOption(null);
    } else {
      if (activeOption === "scan") stopCameraScan();
      setActiveOption(option);
      setScanResult(null);
    }
  }

  async function manualCheckIn() {
    if (!manualPhone) return;
    setChecking(true);
    setScanResult(null);
    try {
      const memberRes = await fetch(`/api/members?search=${encodeURIComponent(manualPhone)}`);
      const memberData = await memberRes.json();
      if (memberData.success && memberData.data.length > 0) {
        const memberId = memberData.data[0].id;
        const res = await fetch(`/api/events/${eventId}/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, method: "MANUAL" }),
        });
        const data = await res.json();
        if (data.success) {
          setManualPhone("");
          setScanResult({ ok: true, msg: `Attendance marked for ${memberData.data[0].fullName}` });
          loadAttendance();
        } else {
          setScanResult({ ok: false, msg: data.error || "Check-in failed" });
        }
      } else {
        setScanResult({ ok: false, msg: "Member not found" });
      }
    } catch {
      setScanResult({ ok: false, msg: "Check-in failed" });
    } finally {
      setChecking(false);
    }
  }

  async function generateQrCodes() {
    const memberIds = allMembers.map((m) => m.id);
    if (memberIds.length === 0) return;
    setGeneratingQr(true);
    try {
      await fetch(`/api/events/${eventId}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds }),
      });
      loadAttendance();
    } catch (error) {
      console.error("Failed to generate QR codes:", error);
    } finally {
      setGeneratingQr(false);
    }
  }

  function downloadQr(token: string, name: string) {
    const url = `${window.location.origin}/scan?token=${token}`;
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    link.download = `qr-${name.replace(/\s+/g, "-")}.png`;
    link.target = "_blank";
    link.click();
  }

  function printAllQr() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = qrCodes.map((qr) => {
      const url = `${window.location.origin}/scan?token=${qr.token}`;
      const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      return `<div style="display:inline-block;text-align:center;margin:10px;padding:10px;border:1px solid #ccc;border-radius:8px;page-break-inside:avoid;">
        <img src="${qrImg}" width="150" height="150" />
        <p style="font-size:12px;margin:4px 0 0;">${qr.member?.fullName || "Member"}</p>
        <p style="font-size:10px;color:#666;margin:2px 0 0;">${qr.member?.phone || ""}</p>
      </div>`;
    }).join("");
    printWindow.document.write(`<html><head><title>QR Codes</title></head><body style="text-align:center;padding:20px;"><h2>QR Attendance Codes</h2>${html}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  const qrScanCount = records.filter((r) => r.method === "QR_SCAN").length;
  const manualCount = records.filter((r) => r.method === "MANUAL").length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <Link href={`/admin/events/${eventId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold mt-1">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {records.length} checked in · {qrScanCount} via QR · {manualCount} manual
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-0">
        <button
          onClick={() => setTab("checkin")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "checkin" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Check-In
        </button>
        <button
          onClick={() => setTab("qrcodes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "qrcodes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          QR Codes ({qrCodes.length})
        </button>
      </div>

      {tab === "checkin" && (
        <div className="space-y-4">
          {/* 3 Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleOptionClick("scan")}
              className={`card text-center py-6 transition-all ${
                activeOption === "scan"
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted"
              }`}
            >
              <span className="text-3xl block mb-2">📷</span>
              <p className="font-semibold">Scan QR Code</p>
              <p className="text-xs text-muted-foreground mt-1">Scan member&apos;s QR with camera</p>
            </button>

            <button
              onClick={() => handleOptionClick("showqr")}
              className={`card text-center py-6 transition-all ${
                activeOption === "showqr"
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted"
              }`}
            >
              <span className="text-3xl block mb-2">📱</span>
              <p className="font-semibold">Show QR Code</p>
              <p className="text-xs text-muted-foreground mt-1">Show QR for members to scan</p>
            </button>

            <button
              onClick={() => handleOptionClick("manual")}
              className={`card text-center py-6 transition-all ${
                activeOption === "manual"
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted"
              }`}
            >
              <span className="text-3xl block mb-2">✏️</span>
              <p className="font-semibold">Manual Check-In</p>
              <p className="text-xs text-muted-foreground mt-1">Search by name or phone</p>
            </button>
          </div>

          {/* Scan Result */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  scanResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {scanResult.ok ? "✅" : "❌"} {scanResult.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Option Panels */}
          <AnimatePresence>
            {activeOption === "scan" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card">
                  <h3 className="font-semibold mb-3">📷 Scan Member&apos;s QR Code</h3>
                  {cameraActive ? (
                    <div className="space-y-3">
                      <div id="admin-qr-scanner" className="rounded-xl overflow-hidden" />
                      <button onClick={stopCameraScan} className="btn btn-destructive w-full">
                        Stop Camera
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Point the camera at a member&apos;s QR code to check them in instantly.
                      </p>
                      <button onClick={startCameraScan} className="btn btn-primary w-full">
                        📷 Start Camera
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeOption === "showqr" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card text-center">
                  <h3 className="font-semibold mb-3">📱 Venue QR Code</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Show this QR to members. They scan it with their phone to mark attendance.
                  </p>
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`event:${eventId}`)}`}
                      alt="Venue QR Code"
                      width={220}
                      height={220}
                      className="rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Members scan this → select their name → attendance marked
                  </p>
                </div>
              </motion.div>
            )}

            {activeOption === "manual" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card">
                  <h3 className="font-semibold mb-3">✏️ Manual Check-In</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder="Search by name or phone..."
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && manualCheckIn()}
                    />
                    <button
                      onClick={manualCheckIn}
                      disabled={checking || !manualPhone}
                      className="btn btn-primary"
                    >
                      {checking ? "Checking..." : "Check In"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attendance Records Table */}
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">📋</span>
              <p className="font-medium">No attendance records yet</p>
              <p className="text-sm text-muted-foreground">Use one of the options above to check in members</p>
            </div>
          ) : (
            <div className="card">
              <h3 className="font-semibold mb-3">Attendance Records ({records.length})</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Method</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td className="font-medium">{r.member?.fullName || "—"}</td>
                        <td className="text-sm">{r.member?.phone || "—"}</td>
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
      )}

      {tab === "qrcodes" && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Generate QR Codes</h3>
              <div className="flex gap-2">
                {qrCodes.length > 0 && (
                  <button onClick={printAllQr} className="btn btn-secondary text-xs">
                    🖨️ Print All
                  </button>
                )}
                <button
                  onClick={generateQrCodes}
                  disabled={generatingQr || allMembers.length === 0}
                  className="btn btn-primary text-xs"
                >
                  {generatingQr ? "Generating..." : `Generate for ${allMembers.length} Members`}
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate unique QR codes for each member. Members show their QR code at the venue for instant check-in.
            </p>
          </div>

          {qrCodes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {qrCodes.map((qr) => {
                const url = `${typeof window !== "undefined" ? window.location.origin : ""}/scan?token=${qr.token}`;
                const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
                return (
                  <div key={qr.id} className={`card text-center ${qr.isCheckedIn ? "opacity-60" : ""}`}>
                    <img src={qrImg} alt="QR Code" className="mx-auto mb-2 rounded" width={120} height={120} />
                    <p className="text-xs font-medium truncate">{qr.member?.fullName || "Member"}</p>
                    <p className="text-xs text-muted-foreground">{qr.member?.phone}</p>
                    {qr.isCheckedIn ? (
                      <span className="badge badge-success text-xs mt-1">✓ Checked In</span>
                    ) : (
                      <button
                        onClick={() => downloadQr(qr.token, qr.member?.fullName || "member")}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Download
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">📱</span>
              <p className="font-medium">No QR codes yet</p>
              <p className="text-sm text-muted-foreground">Generate QR codes for members to use at check-in</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
