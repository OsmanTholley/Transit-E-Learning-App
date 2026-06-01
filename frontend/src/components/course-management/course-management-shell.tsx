"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CourseSubnav } from "./course-subnav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/courses/all": { title: "All Courses", subtitle: "Manage courses, lecturers, years, and semesters." },
  "/admin/courses/add": { title: "Add Course", subtitle: "Create a new course in the academic catalog." },
  "/admin/courses/assign": { title: "Assign Courses", subtitle: "Assign lecturers, programs, years, and semesters." },
  "/admin/courses/categories": { title: "Course Categories", subtitle: "Organize courses by category type." },
  "/admin/courses/semesters": { title: "Semester Management", subtitle: "Manage semesters and academic sessions." },
  "/admin/courses/reports": {
    title: "Course Reports",
    subtitle: "Course analytics, enrollment insights, and exportable reports.",
  },
};

const coursePaths = new Set(Object.keys(pageMeta));

export function CourseManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta["/admin/courses/all"];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <AdminPageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          coursePaths.has(pathname) ? (
            <Link
              href="/admin/courses/add"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Add course
            </Link>
          ) : undefined
        }
      />
      <CourseSubnav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
