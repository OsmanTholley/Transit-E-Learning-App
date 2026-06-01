"use client";

import { useMemo, useState } from "react";
import { useStudents } from "@/hooks/use-students";
import { StudentRecord } from "@/types/student";
import { StudentFilters, type StudentFilterValues } from "./student-filters";
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
  const { students, loading, error } = useStudents();
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
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8">
        <p className="text-sm text-slate-500">Loading students…</p>
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
        <StatCard label="Total Students" value={students.length} tone="emerald" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Suspended" value={suspended} tone="rose" />
        <StatCard label="Pending" value={pending} tone="amber" />
      </div>

      <StudentsTable
        students={filtered}
        title="All students"
        variant="directory"
        actions="view"
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
