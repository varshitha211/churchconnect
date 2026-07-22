"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [churchName, setChurchName] = useState("Sion Holy Church");

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your ChurchConnect instance</p>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold">Church Information</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Church Name</label>
          <input
            type="text"
            className="input"
            value={churchName}
            onChange={(e) => setChurchName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input type="text" className="input" placeholder="Church address" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="tel" className="input" placeholder="+91..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="input" placeholder="contact@church.com" />
          </div>
        </div>
        <button className="btn btn-primary">Save Settings</button>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold">Notification Settings</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked readOnly className="w-4 h-4 rounded" />
            <span className="text-sm">Web Push Notifications (Free — VAPID)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked readOnly className="w-4 h-4 rounded" />
            <span className="text-sm">WhatsApp Click-to-Chat (Free)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" />
            <span className="text-sm">Automated Voice Calls (Requires provider credits)</span>
          </label>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold">Data Management</h3>
        <p className="text-sm text-muted-foreground">Export or manage your church data</p>
        <div className="flex gap-3">
          <button onClick={() => window.open("/api/members/export", "_blank")} className="btn btn-secondary">
            ↓ Export All Members
          </button>
        </div>
      </div>
    </div>
  );
}
