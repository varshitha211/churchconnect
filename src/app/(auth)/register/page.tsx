"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isChurchAdmin, setIsChurchAdmin] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    churchName: "",
    phone: "",
    gender: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (!isChurchAdmin && !form.phone.trim()) {
      setError("Phone number is required for member registration");
      setLoading(false);
      return;
    }

    if (!isChurchAdmin && form.phone.trim().replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number (at least 10 digits)");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          churchName: isChurchAdmin ? form.churchName : undefined,
          phone: !isChurchAdmin ? form.phone : undefined,
          gender: !isChurchAdmin && form.gender ? form.gender : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push(isChurchAdmin ? "/admin/dashboard" : "/member");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Create Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setIsChurchAdmin(false)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              !isChurchAdmin ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Member
          </button>
          <button
            type="button"
            onClick={() => setIsChurchAdmin(true)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              isChurchAdmin ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Church Admin
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            className="input"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
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
            placeholder="Min 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {!isChurchAdmin && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="tel"
                className="input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">10-digit mobile number</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                className="input"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </>
        )}

        {isChurchAdmin && (
          <div>
            <label className="block text-sm font-medium mb-1">Church Name</label>
            <input
              type="text"
              className="input"
              placeholder="Sion Holy Church"
              value={form.churchName}
              onChange={(e) => setForm({ ...form, churchName: e.target.value })}
              required
            />
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : "Create Account"}
        </button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><div className="spinner" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
