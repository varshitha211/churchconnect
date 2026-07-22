"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardData {
  member: { name: string; email: string; avatar?: string };
  stats: {
    attendanceMonth: number;
    attendanceYear: number;
    attendancePercent: number;
    upcomingEvents: number;
    prayerRequests: number;
    unreadNotifications: number;
  };
  upcomingEvents: { id: string; name: string; slug: string; startDate: string; startTime: string; venue: string; category: string }[];
  recentPrayers: { id: string; title: string; status: string; createdAt: string }[];
  announcements: { id: string; title: string; description: string; priority: string; createdAt: string }[];
}

export default function MemberDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/dashboard");
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-24 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-muted-foreground">Could not load dashboard</div>;

  const greetingTime = new Date().getHours();
  const greeting = greetingTime < 12 ? "Good Morning" : greetingTime < 17 ? "Good Afternoon" : "Good Evening";

  const stats = [
    { label: "Attendance", value: `${data.stats.attendancePercent}%`, sub: `${data.stats.attendanceMonth} this month`, color: "bg-primary/10 text-primary", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Upcoming Events", value: data.stats.upcomingEvents.toString(), sub: "This year", color: "bg-blue-50 text-blue-600", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { label: "Prayer Requests", value: data.stats.prayerRequests.toString(), sub: "Active", color: "bg-amber-50 text-amber-600", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
    { label: "Notifications", value: data.stats.unreadNotifications.toString(), sub: "Unread", color: "bg-rose-50 text-rose-600", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl pb-20 lg:pb-0">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
            {data.member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-white/80 text-sm">{greeting}</p>
            <h2 className="text-xl font-bold">{data.member.name}</h2>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/member/attendance", label: "Check In", icon: "📱", color: "bg-primary/10" },
          { href: "/member/prayer", label: "Prayer", icon: "🙏", color: "bg-amber-50" },
          { href: "/member/bible", label: "Bible", icon: "📖", color: "bg-green-50" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className={`card-flat card text-center py-4 ${a.color} hover:shadow-md transition-all`}>
            <span className="text-2xl block mb-1">{a.icon}</span>
            <span className="text-xs font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Upcoming Events */}
      {data.upcomingEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Upcoming Events</h3>
            <Link href="/member/events" className="text-xs text-primary font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {data.upcomingEvents.map((e) => (
              <Link key={e.id} href={`/event/${e.slug}`} className="card flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
                  {new Date(e.startDate).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.startTime} · {e.venue}</p>
                </div>
                <span className="badge badge-primary text-xs shrink-0">{e.category.replace("_", " ")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Announcements</h3>
            <Link href="/member/announcements" className="text-xs text-primary font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {data.announcements.map((a) => (
              <div key={a.id} className="card">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.priority === "HIGH" || a.priority === "URGENT" ? "bg-destructive" : a.priority === "NORMAL" ? "bg-primary" : "bg-muted-foreground"}`} />
                  <div>
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(a.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
