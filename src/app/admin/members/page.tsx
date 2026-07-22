"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Member } from "@/types";

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [page, setPage] = useState(1);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (search) params.set("search", search);
    if (gender) params.set("gender", gender);
    if (ageGroup) params.set("ageGroup", ageGroup);

    try {
      const res = await fetch(`/api/members?${params}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, gender, ageGroup]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    setPage(1);
  }, [search, gender, ageGroup]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will remove them from the members list.`)) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) fetchMembers();
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  }

  function handleExport() {
    window.open("/api/members/export", "_blank");
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total} members total` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExport} className="btn btn-secondary">
            ↓ Export CSV
          </button>
          <Link href="/admin/members/import" className="btn btn-secondary">
            ↑ Import CSV
          </Link>
          <Link href="/admin/members/new" className="btn btn-primary">
            + Add Member
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-auto"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            className="input w-auto"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
          >
            <option value="">All Ages</option>
            <option value="CHILD">Child</option>
            <option value="YOUTH">Youth</option>
            <option value="ADULT">Adult</option>
            <option value="SENIOR">Senior</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">👥</span>
            <p className="font-medium">No members found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search" : "Add your first member to get started"}
            </p>
            <Link href="/admin/members/new" className="btn btn-primary mt-4">
              + Add Member
            </Link>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="hidden md:table-cell">Phone</th>
                    <th className="hidden lg:table-cell">Email</th>
                    <th className="hidden lg:table-cell">Area</th>
                    <th className="hidden md:table-cell">Group</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {member.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.fullName}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{member.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell text-sm">{member.phone}</td>
                      <td className="hidden lg:table-cell text-sm text-muted-foreground">
                        {member.email || "—"}
                      </td>
                      <td className="hidden lg:table-cell text-sm">{member.area || "—"}</td>
                      <td className="hidden md:table-cell">
                        {member.ageGroup && (
                          <span className="badge badge-info">{member.ageGroup}</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            member.isSubscribed ? "badge-success" : "badge-warning"
                          }`}
                        >
                          {member.isSubscribed ? "Subscribed" : "Unsubscribed"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="btn btn-ghost text-xs px-2 py-1"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(member.id, member.fullName)}
                            className="btn btn-ghost text-xs px-2 py-1 text-destructive"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page === pagination.totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
