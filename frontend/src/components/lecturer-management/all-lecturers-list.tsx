"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useMemo, useState } from "react";
import { LecturerRecord } from "@/types/lecturer";
import { useLecturers } from "@/hooks/use-lecturers";
import { LecturerFilters, LecturerFilterValues } from "./lecturer-filters";
import { LecturerCrudPageHero } from "./lecturer-crud-hero";
import { LecturersTable } from "./lecturers-table";
import { StatCard, StudentSection } from "@/components/student-management/ui";

const emptyFilters: LecturerFilterValues = {
  search: "",
  department: "",
  accountStatus: "",
  verificationStatus: "",
};

function matchesFilters(lecturer: LecturerRecord, filters: LecturerFilterValues) {
  const q = filters.search.trim().toLowerCase();
  if (q) {
    const haystack = [lecturer.fullName, lecturer.email, lecturer.assignedCourses].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.department && !lecturer.department.includes(filters.department)) return false;
  if (filters.accountStatus && lecturer.accountStatus !== filters.accountStatus) return false;
  if (filters.verificationStatus && lecturer.verificationStatus !== filters.verificationStatus) return false;
  return true;
}

export function AllLecturersList() {
  const { lecturers, loading, error, refetch } = useLecturers();
  const [filters, setFilters] = useState<LecturerFilterValues>(emptyFilters);

  const departmentOptions = useMemo(() => {
    const names = new Set<string>();
    for (const l of lecturers) {
      if (l.department && l.department !== "—") {
        l.department.split(", ").forEach((d) => names.add(d));
      }
    }
    return [...names].sort();
  }, [lecturers]);

  const filtered = useMemo(
    () => lecturers.filter((l) => matchesFilters(l, filters)),
    [lecturers, filters],
  );

  const active = lecturers.filter((l) => l.accountStatus === "Active").length;
  const suspended = lecturers.filter((l) => l.accountStatus === "Suspended").length;
  const pending = lecturers.filter((l) => l.verificationStatus === "Pending").length;

  if (loading) {
    return (
      <LoadingState message="Loading lecturers…" panel minHeight={200} />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
    );
  }

  return (
    <StudentSection>
      <LecturerCrudPageHero section="all" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Lecturers" value={lecturers.length} tone="amber" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Suspended" value={suspended} tone="rose" />
        <StatCard label="Pending" value={pending} tone="amber" />
      </div>

      <LecturersTable
        lecturers={filtered}
        title="All lecturers"
        onRefresh={() => void refetch()}
        toolbar={
          <LecturerFilters
            inline
            departmentOptions={departmentOptions}
            values={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />
        }
      />
    </StudentSection>
  );
}
