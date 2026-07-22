"use client";

import { useEffect, useState } from "react";

export default function ReportsPage() {
  const [members, setMembers] = useState<{ total: number; byGender: Record<string, number>; byAge: Record<string, number>; byArea: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/members?per_page=1000").then((r) => r.json()),
    ]).then(([membersData]) => {
      if (membersData.success) {
        const members = membersData.data;
        const byGender: Record<string, number> = {};
        const byAge: Record<string, number> = {};
        const byArea: Record<string, number> = {};

        members.forEach((m: { gender?: string; ageGroup?: string; area?: string }) => {
          if (m.gender) byGender[m.gender] = (byGender[m.gender] || 0) + 1;
          if (m.ageGroup) byAge[m.ageGroup] = (byAge[m.ageGroup] || 0) + 1;
          if (m.area) byArea[m.area] = (byArea[m.area] || 0) + 1;
        });

        setMembers({ total: membersData.pagination.total, byGender, byAge, byArea });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Member demographics and statistics</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : !members ? (
        <p className="text-center py-12 text-muted-foreground">Failed to load reports</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-semibold mb-3">By Gender</h3>
            <div className="space-y-2">
              {Object.entries(members.byGender).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span>{key}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">By Age Group</h3>
            <div className="space-y-2">
              {Object.entries(members.byAge).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span>{key}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">By Area</h3>
            <div className="space-y-2">
              {Object.entries(members.byArea).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span>{key}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
