"use client";

import { CourseRecord } from "@/types/academic";
import { AdminTableShell, ViewActionLink } from "@/components/admin/admin-table-shell";
import { StatusBadge } from "@/components/student-management/ui";
import type { ReactNode } from "react";

type Props = {
  courses: CourseRecord[];
  title?: string;
  toolbar?: ReactNode;
  actions?: "none" | "view";
};

function CourseCell({ course }: { course: CourseRecord }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-slate-900" title={course.title}>
        {course.title}
      </p>
      <p className="truncate text-xs text-slate-500" title={`${course.department} · ${course.program}`}>
        {course.department} · {course.program}
      </p>
    </div>
  );
}

function AcademicCell({ course }: { course: CourseRecord }) {
  return (
    <div className="min-w-0 max-w-[220px]">
      <p className="truncate text-slate-900" title={course.lecturer}>
        {course.lecturer}
      </p>
      <p
        className="truncate text-xs text-slate-500"
        title={`${course.level} · ${course.semester}`}
      >
        {course.level} · {course.semester}
      </p>
    </div>
  );
}

export function CoursesTable({
  courses,
  title = "All courses",
  toolbar,
  actions = "view",
}: Props) {
  const showActions = actions !== "none";
  const colCount = showActions ? 6 : 5;

  return (
    <AdminTableShell title={title} count={courses.length} countLabel="courses" toolbar={toolbar}>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[88px] sm:w-[96px]" />
          <col />
          <col className="hidden md:table-column" />
          <col className="w-[88px] lg:w-[100px]" />
          <col className="hidden xl:table-column w-[88px]" />
          {showActions ? <col className="w-[72px]" /> : null}
        </colgroup>
        <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5 sm:px-4">Code</th>
            <th className="px-3 py-2.5 sm:px-4">Course</th>
            <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Lecturer</th>
            <th className="px-3 py-2.5 sm:px-4">Status</th>
            <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Students</th>
            {showActions ? <th className="px-3 py-2.5 text-right sm:px-4">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-slate-500">
                No courses match your filters. Add a course or adjust search criteria.
              </td>
            </tr>
          ) : (
            courses.map((course) => (
              <tr key={course.id} className="bg-white transition-colors hover:bg-slate-50/80">
                <td className="px-3 py-3 font-mono text-xs font-semibold text-emerald-800 sm:px-4">
                  {course.code}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <CourseCell course={course} />
                  <p className="mt-1 truncate text-xs text-slate-500 md:hidden" title={course.lecturer}>
                    {course.lecturer} · {course.level}
                  </p>
                </td>
                <td className="hidden px-3 py-3 md:table-cell md:px-4">
                  <AcademicCell course={course} />
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <StatusBadge status={course.status} />
                </td>
                <td className="hidden px-3 py-3 text-xs text-slate-600 xl:table-cell xl:px-4">
                  {course.totalStudents}
                </td>
                {showActions ? (
                  <td className="px-3 py-3 text-right sm:px-4">
                    <ViewActionLink href={`/admin/courses/assign`} label="View" />
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
