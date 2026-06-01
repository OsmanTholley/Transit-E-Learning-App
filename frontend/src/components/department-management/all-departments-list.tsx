"use client";

import { useMemo, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { DepartmentRecord } from "@/types/department";
import {
  DepartmentFilters,
  DepartmentFilterValues,
  matchesDepartmentSize,
} from "./department-filters";
import { DepartmentsTable } from "./departments-table";
import { StatCard, StudentSection } from "@/components/student-management/ui";

const emptyFilters: DepartmentFilterValues = {
  search: "",
  status: "",
  size: "",
};

function matchesFilters(department: DepartmentRecord, filters: DepartmentFilterValues) {
  const q = filters.search.trim().toLowerCase();
  if (q) {
    const haystack = [department.name, department.code, department.head, department.description]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.status && department.status !== filters.status) return false;
  if (!matchesDepartmentSize(department.totalStudents, filters.size)) return false;
  return true;
}

export function AllDepartmentsList() {
  const { data, loading, error } = useApiLoad<{ departments: DepartmentRecord[] }>(
    "/api/departments",
    { errorTitle: "Could not load departments" }
  );
  const departments = data?.departments ?? [];
  const [filters, setFilters] = useState<DepartmentFilterValues>(emptyFilters);

  const filtered = useMemo(
    () => departments.filter((d) => matchesFilters(d, filters)),
    [departments, filters],
  );

  const active = departments.filter((d) => d.status === "Active").length;
  const inactive = departments.filter((d) => d.status === "Inactive").length;
  const pending = departments.filter((d) => d.status === "Pending").length;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8">
        <p className="text-sm text-slate-500">Loading departments…</p>
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
        <StatCard label="Total Departments" value={departments.length} tone="emerald" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Inactive" value={inactive} tone="slate" />
        <StatCard label="Pending" value={pending} tone="amber" />
      </div>

      <DepartmentsTable
        departments={filtered}
        title="All departments"
        actions="view"
        toolbar={
          <DepartmentFilters
            inline
            values={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />
        }
      />
    </StudentSection>
  );
}
