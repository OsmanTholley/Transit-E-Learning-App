"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useMemo, useState } from "react";
import { useStudents } from "@/hooks/use-students";
import { StudentRecord } from "@/types/student";
import { StudentFilters, type StudentFilterValues } from "./student-filters";
import { StudentCrudPageHero } from "./student-crud-hero";
import { StudentsTable } from "./students-table";
import { StatCard, StudentSection } from "./ui";

const emptyFilters: StudentFilterValues = {
  search: "",
  department: "",
  year: "",
  program: "",
  status: "",
};

function matchesFilters(student: StudentRecord, filters: StudentFilterValues) {
  const q = filters.search.trim().toLowerCase();
  if (q) {
    const haystack = [student.fullName, student.studentId, student.email].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.department && student.department !== filters.department) return false;
  if (filters.year && student.year !== filters.year) return false;
  if (filters.program && student.program !== filters.program) return false;
  if (filters.status && student.status !== filters.status) return false;
  return true;
}

export function AllStudentsList() {
  const { students, loading, error, refetch } = useStudents();
  const [filters, setFilters] = useState<StudentFilterValues>(emptyFilters);

  const filtered = useMemo(
    () => students.filter((s) => matchesFilters(s, filters)),
    [students, filters],
  );

  const active = students.filter((s) => s.status === "Active").length;
  const suspended = students.filter((s) => s.status === "Suspended").length;
  const pending = students.filter((s) => s.status === "Pending").length;

  if (loading) {
    return (
      <LoadingState message="Loading students…" panel minHeight={200} />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
    );
  }

  return (
    <StudentSection>
      <StudentCrudPageHero section="all" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={students.length} tone="amber" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Suspended" value={suspended} tone="rose" />
        <StatCard label="Pending" value={pending} tone="amber" />
      </div>

      <StudentsTable
        students={filtered}
        title="All students"
        onRefresh={() => void refetch()}
        toolbar={
          <StudentFilters
            inline
            values={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />
        }
      />
    </StudentSection>
  );
}
