"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { memberSchema, type MemberInput } from "@/lib/validators";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetch(`/api/members/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const m = data.data;
          setForm({
            fullName: m.fullName,
            phone: m.phone,
            whatsappNumber: m.whatsappNumber || "",
            email: m.email || "",
            ageGroup: m.ageGroup || undefined,
            gender: m.gender || undefined,
            area: m.area || "",
            isSubscribed: m.isSubscribed,
          });
        }
      })
      .catch(() => setError("Failed to load member"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const parsed = memberSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update member");
        return;
      }

      router.push("/admin/members");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof MemberInput, value: string | boolean | undefined) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Member</h1>
        <p className="text-sm text-muted-foreground">Update member information</p>
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
              value={form.whatsappNumber || ""}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="input"
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
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : "Save Changes"}
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
