"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@/lib/validators";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (from) {
        router.push(from);
      } else if (data.data.user.role === "MEMBER") {
        router.push("/member");
      } else {
        router.push("/admin/dashboard");
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setIsMember(false)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              !isMember ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Church Admin
          </button>
          <button
            type="button"
            onClick={() => setIsMember(true)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              isMember ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Member
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="input"
            placeholder={isMember ? "your@email.com" : "admin@church.com"}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="input"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>
      <p className="text-xs text-muted-foreground text-center mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><div className="spinner" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
