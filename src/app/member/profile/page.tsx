"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface MemberData {
  id: string; fullName: string; phone: string; email?: string; avatar?: string;
  address?: string; bloodGroup?: string; dateOfBirth?: string; familyMembers?: string;
  ageGroup?: string; gender?: string; area?: string;
}

export default function ProfilePage() {
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<MemberData>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/member/profile");
      const d = await res.json();
      if (d.success) { setMember(d.data); setForm(d.data); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setMember(d.data);
        setEditing(false);
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch { toast.error("Something went wrong"); } finally { setSaving(false); }
  }

  if (loading) return <div className="space-y-4 animate-fade-in"><div className="h-48 skeleton rounded-2xl" /><div className="h-64 skeleton rounded-2xl" /></div>;
  if (!member) return <div className="text-center py-20 text-muted-foreground">Profile not found</div>;

  const fields = [
    { key: "fullName", label: "Full Name", type: "text" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "email", label: "Email", type: "email" },
    { key: "address", label: "Address", type: "text" },
    { key: "bloodGroup", label: "Blood Group", type: "text" },
    { key: "dateOfBirth", label: "Date of Birth", type: "date" },
    { key: "gender", label: "Gender", type: "select", options: ["MALE", "FEMALE", "OTHER"] },
    { key: "area", label: "Area", type: "text" },
    { key: "familyMembers", label: "Family Members", type: "text" },
  ];

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold">My Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal information</p>
      </div>

      {/* Avatar Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-3">
          {member.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <h3 className="text-lg font-bold">{member.fullName}</h3>
        <p className="text-sm text-muted-foreground">{member.email || member.phone}</p>
        <div className="flex justify-center gap-2 mt-3">
          {member.bloodGroup && <span className="badge badge-destructive">{member.bloodGroup}</span>}
          {member.area && <span className="badge badge-info">{member.area}</span>}
        </div>
      </motion.div>

      {/* Edit/View */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Personal Details</h3>
          <button onClick={() => { setEditing(!editing); if (!editing) setForm(member); }} className="btn btn-ghost btn-sm text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground font-medium">{f.label}</label>
              {editing ? (
                f.type === "select" ? (
                  <select className="input mt-1" value={(form as Record<string, unknown>)[f.key] as string || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">Select</option>
                    {f.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} className="input mt-1" value={(form as Record<string, unknown>)[f.key] as string || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                )
              ) : (
                <p className="text-sm font-medium mt-0.5">
                  {f.key === "dateOfBirth" && member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString("en-IN") :
                   (member as unknown as Record<string, unknown>)[f.key] as string || "—"}
                </p>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <button onClick={save} disabled={saving} className="btn btn-primary w-full mt-4">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
