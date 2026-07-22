import Link from "next/link";
import { CHURCH_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
              C
            </div>
            <span className="font-bold">ChurchConnect</span>
          </div>
          <Link href="/login" className="btn btn-primary">
            Admin Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg px-4 py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-bold mx-auto mb-6">
            C
          </div>
          <h1 className="text-4xl font-bold mb-3">ChurchConnect</h1>
          <p className="text-lg text-muted-foreground mb-2">
            {CHURCH_NAME}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Smart Church Event Communication &amp; Notification Platform
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="card text-center py-4">
              <span className="text-2xl">📅</span>
              <p className="text-xs font-medium mt-2">Events</p>
            </div>
            <div className="card text-center py-4">
              <span className="text-2xl">🔔</span>
              <p className="text-xs font-medium mt-2">Notifications</p>
            </div>
            <div className="card text-center py-4">
              <span className="text-2xl">📞</span>
              <p className="text-xs font-medium mt-2">Voice Calls</p>
            </div>
            <div className="card text-center py-4">
              <span className="text-2xl">📊</span>
              <p className="text-xs font-medium mt-2">Analytics</p>
            </div>
          </div>

          <Link href="/login" className="btn btn-primary px-8 py-3 text-base">
            Get Started →
          </Link>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        ChurchConnect — Built for churches, by faith.
      </footer>
    </div>
  );
}
