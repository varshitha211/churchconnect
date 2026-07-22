"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePushNotifications } from "@/lib/usePushNotifications";

export default function SettingsPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [lang, setLang] = useState("en");
  const [notifPrefs, setNotifPrefs] = useState({ events: true, prayers: true, attendance: true, announcements: true });
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotifications();

  function toggleDark() {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Customize your experience</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
        <h3 className="font-bold">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
          </div>
          <button onClick={toggleDark} className={`relative w-12 h-7 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-border"}`}>
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card space-y-4">
        <h3 className="font-bold">Push Notifications</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{isSubscribed ? "Subscribed" : "Not Subscribed"}</p>
            <p className="text-xs text-muted-foreground">
              {!isSupported
                ? "Push notifications are not supported in this browser"
                : isSubscribed
                ? "You will receive push notifications for events and announcements"
                : "Subscribe to receive push notifications"}
            </p>
          </div>
          {isSupported && (
            isSubscribed ? (
              <button onClick={unsubscribe} className="btn btn-secondary btn-sm">Unsubscribe</button>
            ) : (
              <button onClick={subscribe} className="btn btn-primary btn-sm">Subscribe</button>
            )
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card space-y-4">
        <h3 className="font-bold">Language</h3>
        <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ml">Malayalam</option>
          <option value="ta">Tamil</option>
        </select>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card space-y-4">
        <h3 className="font-bold">Notification Preferences</h3>
        {Object.entries(notifPrefs).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between">
            <p className="text-sm font-medium capitalize">{key}</p>
            <button onClick={() => setNotifPrefs({ ...notifPrefs, [key]: !val })} className={`relative w-12 h-7 rounded-full transition-colors ${val ? "bg-primary" : "bg-border"}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${val ? "left-6" : "left-1"}`} />
            </button>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h3 className="font-bold mb-3">Account</h3>
        <button onClick={() => setShowLogout(true)} className="btn btn-destructive w-full">Logout</button>
      </motion.div>

      {showLogout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Confirm Logout</h3>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to logout?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogout(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={logout} className="btn btn-destructive flex-1">Logout</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
