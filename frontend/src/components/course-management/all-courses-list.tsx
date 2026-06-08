"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useMemo, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { CourseRecord } from "@/types/academic";
import { CourseFilters, CourseFilterValues } from "./course-filters";
import { CoursesTable } from "./courses-table";
import { AdminCrudPageHero } from "@/components/admin/admin-entity-crud";
import { StatCard, StudentSection } from "@/components/student-management/ui";

const emptyFilters: CourseFilterValues = {
  search: "",
  department: "",
  program: "",
  status: "",
};

function matchesFilters(course: CourseRecord, filters: CourseFilterValues) {
  const q = filters.search.trim().toLowerCase();
  if (q) {
    const haystack = [course.code, course.title, course.lecturer, course.department, course.program]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.department && course.department !== filters.department) return false;
  if (filters.program && course.program !== filters.program) return false;
  if (filters.status && course.status !== filters.status) return false;
  return true;
}

export function AllCoursesList({
  statusFilter,
  title = "All courses",
}: {
  statusFilter?: CourseRecord["status"];
  title?: string;
}) {
  const { data, loading, error, reload } = useApiLoad<{ courses: CourseRecord[] }>("/api/courses", {
    errorTitle: "Could not load courses",
  });
  const courses = data?.courses ?? [];
  const [filters, setFilters] = useState<CourseFilterValues>({
    ...emptyFilters,
    status: statusFilter ?? "",
  });

  const departmentOptions = useMemo(() => {
    const names = new Set<string>();
    for (const c of courses) {
      if (c.department && c.department !== "—") names.add(c.department);
    }
    return [...names].sort();
  }, [courses]);

  const programOptions = useMemo(() => {
    const names = new Set<string>();
    for (const c of courses) {
      if (c.program && c.program !== "—") names.add(c.program);
    }
    return [...names].sort();
  }, [courses]);

  const filtered = useMemo(
    () => courses.filter((c) => matchesFilters(c, filters)),
    [courses, filters],
  );

  const active = courses.filter((c) => c.status === "Active").length;
  const pending = courses.filter((c) => c.status === "Pending").length;
  const archived = courses.filter((c) => c.status === "Archived").length;

  if (loading) {
    return (
      <LoadingState message="Loading courses…" panel minHeight={200} />
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
        entity="course"
        title={statusFilter === "Archived" ? "Archived courses" : "Manage courses"}
        description="Maintain the course catalog — update codes, titles, year levels, and semesters, or remove courses from the system."
        addHref="/admin/courses/add"
        addLabel="Add course"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Courses" value={courses.length} tone="amber" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="Pending" value={pending} tone="amber" />
        <StatCard label="Archived" value={archived} tone="slate" />
      </div>

      <CoursesTable
        courses={filtered}
        title={title}
        onRefresh={() => void reload()}
        toolbar={
          <CourseFilters
            inline
            departmentOptions={departmentOptions}
            programOptions={programOptions}
            values={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />
        }
      />
    </StudentSection>
  );
}
