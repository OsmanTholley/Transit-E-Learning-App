"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useMemo, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { DepartmentRecord } from "@/types/department";
import {
  DepartmentFilters,
  DepartmentFilterValues,
  matchesDepartmentSize,
} from "./department-filters";
import { DepartmentsTable } from "./departments-table";
import { AdminCrudPageHero } from "@/components/admin/admin-entity-crud";
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
  const { data, loading, error, reload } = useApiLoad<{ departments: DepartmentRecord[] }>(
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
      <LoadingState message="Loading departments…" panel minHeight={200} />
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
        entity="department"
        title="Manage departments"
        description="Create, edit, and remove academic departments. Each department can host programs, courses, and student enrollments."
        addHref="/admin/departments/add"
        addLabel="Add department"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Departments" value={departments.length} tone="amber" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Inactive" value={inactive} tone="slate" />
        <StatCard label="Pending" value={pending} tone="amber" />
      </div>

      <DepartmentsTable
        departments={filtered}
        title="All departments"
        onRefresh={() => void reload()}
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
