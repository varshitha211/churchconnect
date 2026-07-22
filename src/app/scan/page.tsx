"use client";

import { useState, useCallback, useEffect } from "react";

export default function ScanPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; memberName?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const checkIn = useCallback(async (qrToken: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: qrToken }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: `Welcome, ${data.memberName}!`, memberName: data.memberName });
      } else {
        setResult({ success: false, message: data.error || "Check-in failed" });
      }
    } catch {
      setResult({ success: false, message: "Check-in failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      checkIn(urlToken);
    }
  }, [checkIn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
            S
          </div>
          <h1 className="text-xl font-bold">Sion Holy Church</h1>
          <p className="text-sm text-muted-foreground">Event Check-In</p>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Checking in...</p>
            </div>
          ) : result ? (
            <div className="text-center py-6">
              <span className="text-5xl block mb-3">
                {result.success ? "✅" : "❌"}
              </span>
              <h2 className={`text-lg font-bold ${result.success ? "text-success" : "text-destructive"}`}>
                {result.message}
              </h2>
              {result.success && (
                <button
                  onClick={() => { setResult(null); setToken(""); }}
                  className="btn btn-primary mt-4"
                >
                  Scan Another
                </button>
              )}
              {!result.success && (
                <button
                  onClick={() => { setResult(null); setToken(""); }}
                  className="btn btn-secondary mt-4"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : manualMode ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-center">Manual Check-In</h3>
              <input
                type="text"
                className="input"
                placeholder="Enter QR token or member phone"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && token && checkIn(token)}
                autoFocus
              />
              <button
                onClick={() => token && checkIn(token)}
                disabled={!token}
                className="btn btn-primary w-full"
              >
                Check In
              </button>
              <button
                onClick={() => setManualMode(false)}
                className="btn btn-secondary w-full"
              >
                Back to QR Scan
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <span className="text-4xl block">📱</span>
              <p className="text-sm text-muted-foreground">
                Point your camera at the QR code to check in
              </p>
              <button
                onClick={() => setManualMode(true)}
                className="btn btn-secondary w-full"
              >
                Enter Token Manually
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
