"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useMemo, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { ProgramRecord } from "@/types/academic";
import { ProgramsTable } from "./programs-table";
import { AdminCrudPageHero, AdminCrudSearch } from "@/components/admin/admin-entity-crud";
import { StatCard, StudentSection } from "@/components/student-management/ui";

export function AllProgramsList() {
  const { data, loading, error, reload } = useApiLoad<{ programs: ProgramRecord[] }>("/api/programs", {
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
      <LoadingState message="Loading programs…" panel minHeight={200} />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
    );
  }

  return (
    <StudentSection>
      <AdminCrudPageHero
        entity="program"
        title="Manage programs"
        description="Define degree programs under each department. Edit details or remove programs that no longer have enrolled students."
        addHref="/admin/programs/add"
        addLabel="Add program"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Programs" value={programs.length} tone="amber" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Pending" value={pending} tone="amber" />
        <StatCard label="Enrolled Students" value={totalStudents.toLocaleString()} tone="slate" />
      </div>

      <ProgramsTable
        programs={filtered}
        title="All programs"
        onRefresh={() => void reload()}
        toolbar={
          <AdminCrudSearch
            value={search}
            onChange={setSearch}
            placeholder="Search by program, department, or duration…"
          />
        }
      />
    </StudentSection>
  );
}
