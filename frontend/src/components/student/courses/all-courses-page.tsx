"use client";

import { useMemo, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { CourseCard } from "@/components/student/courses/course-card";
import {
  EmptyState,
  LoadingGrid,
  PageHeader,
  SearchFilterBar,
  StatOverviewCard,
} from "@/components/student/courses/ui/course-ui";
import type { CoursesListResponse } from "@/types/student-courses";

export function AllCoursesPage({ filter = "all" }: { filter?: string }) {
  const { data, loading, error } = useApiLoad<CoursesListResponse>(
    `/api/student/courses?filter=${filter}`,
    { errorTitle: "Could not load courses" }
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.courses;
    return data.courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.lecturerName.toLowerCase().includes(q)
    );
  }, [data, search]);

  const titles: Record<string, { title: string; subtitle: string }> = {
    all: {
      title: "All Courses",
      subtitle: "Your registered courses for this academic period",
    },
    "current-semester": {
      title: "Current Semester",
      subtitle: "Courses you are actively studying this semester",
    },
    completed: {
      title: "Completed Courses",
      subtitle: "Courses where you have reached 100% progress",
    },
  };

  const meta = titles[filter] ?? titles.all;

  if (loading) return <LoadingGrid />;
  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={meta.title} subtitle={meta.subtitle} />

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatOverviewCard label="Total Courses" value={data.stats.totalCourses} sub="Enrolled" tone="blue" />
          <StatOverviewCard
            label="Completed"
            value={data.stats.completedCourses}
            sub="Finished courses"
            tone="green"
          />
          <StatOverviewCard
            label="Pending Assignments"
            value={data.stats.pendingAssignments}
            sub="Due soon"
            tone="yellow"
          />
          <StatOverviewCard
            label="Quiz Average"
            value={`${data.stats.averageQuizScore}%`}
            sub="This semester"
            tone="rose"
          />
        </div>
      ) : null}

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search courses by title, code, or lecturer..."
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No courses found"
          message="You are not enrolled in any matching courses yet. Contact your administrator."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
