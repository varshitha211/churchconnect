"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { memberSchema, type MemberInput } from "@/lib/validators";

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<MemberInput>({
    fullName: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    ageGroup: undefined,
    gender: undefined,
    area: "",
    isSubscribed: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsed = memberSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create member");
        return;
      }

      router.push("/admin/members");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof MemberInput, value: string | boolean | undefined) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Add New Member</h1>
        <p className="text-sm text-muted-foreground">Add a church member to the database</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              type="text"
              className="input"
              placeholder="John Abraham"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <input
              type="tel"
              className="input"
              placeholder="+919876543210"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
            <input
              type="tel"
              className="input"
              placeholder="Same as phone if blank"
              value={form.whatsappNumber || ""}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input"
              placeholder="john@example.com"
              value={form.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Age Group</label>
            <select
              className="input"
              value={form.ageGroup || ""}
              onChange={(e) => updateField("ageGroup", e.target.value || undefined)}
            >
              <option value="">Select</option>
              <option value="CHILD">Child</option>
              <option value="YOUTH">Youth</option>
              <option value="ADULT">Adult</option>
              <option value="SENIOR">Senior</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              className="input"
              value={form.gender || ""}
              onChange={(e) => updateField("gender", e.target.value || undefined)}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Area / Location</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Downtown, East Side"
              value={form.area || ""}
              onChange={(e) => updateField("area", e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isSubscribed}
            onChange={(e) => updateField("isSubscribed", e.target.checked)}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">Subscribed to receive notifications</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : "Add Member"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/members")}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
