"use client";

import { useMemo, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { ProgramRecord } from "@/types/academic";
import { ProgramsTable } from "./programs-table";
import { StatCard, StudentSection } from "@/components/student-management/ui";

export function AllProgramsList() {
  const { data, loading, error } = useApiLoad<{ programs: ProgramRecord[] }>("/api/programs", {
    errorTitle: "Could not load programs",
  });
  const programs = data?.programs ?? [];
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) =>
      [p.name, p.department, p.duration].join(" ").toLowerCase().includes(q),
    );
  }, [programs, search]);

  const active = programs.filter((p) => p.status === "Active").length;
  const pending = programs.filter((p) => p.status === "Pending").length;
  const totalStudents = programs.reduce((sum, p) => sum + p.totalStudents, 0);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8">
        <p className="text-sm text-slate-500">Loading programs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
    );
  }

  return (
    <StudentSection>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Programs" value={programs.length} tone="emerald" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Pending" value={pending} tone="amber" />
        <StatCard label="Enrolled Students" value={totalStudents.toLocaleString()} tone="slate" />
      </div>

      <ProgramsTable
        programs={filtered}
        title="All programs"
        actions="view"
        toolbar={
          <input
            type="search"
            placeholder="Search by program, department, or duration…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 sm:max-w-md"
          />
        }
      />
    </StudentSection>
  );
}
