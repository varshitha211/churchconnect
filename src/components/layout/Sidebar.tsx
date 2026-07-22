"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    ],
  },
  {
    label: "Manage",
    items: [
      { name: "Members", href: "/admin/members", icon: "👥" },
      { name: "Events", href: "/admin/events", icon: "📅" },
      { name: "Sermons", href: "/admin/sermons", icon: "🎬" },
      { name: "Announcements", href: "/admin/announcements", icon: "📢" },
      { name: "Templates", href: "/admin/templates", icon: "📝" },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Follow-Up", href: "/admin/follow-up", icon: "🔔" },
      { name: "Reports", href: "/admin/reports", icon: "📈" },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/admin/settings", icon: "⚙️" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
            C
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">ChurchConnect</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          href="/event/demo"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <span className="text-base">🌐</span>
          Public Site
        </Link>
      </div>
    </aside>
  );
}
