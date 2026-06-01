"use client";

import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProgramsCoursesSubnav } from "./programs-courses-subnav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/programs-courses/programs": { title: "Programs", subtitle: "Create and manage academic programs by department." },
  "/admin/programs-courses/all": { title: "All Courses", subtitle: "Manage courses, lecturers, levels, and semesters." },
  "/admin/programs-courses/add": { title: "Add Course", subtitle: "Create a new course in the academic catalog." },
  "/admin/programs-courses/assign": { title: "Assign Courses", subtitle: "Assign lecturers, programs, levels, and semesters." },
  "/admin/programs-courses/categories": { title: "Course Categories", subtitle: "Organize courses by category type." },
  "/admin/programs-courses/levels": { title: "Course Years", subtitle: "Manage Year 1–Year 4 for course visibility." },
  "/admin/programs-courses/semesters": { title: "Semester Management", subtitle: "Manage semesters and academic sessions." },
  "/admin/programs-courses/analytics": { title: "Course Analytics", subtitle: "Enrollment, completion, and performance charts." },
  "/admin/programs-courses/reports": { title: "Course Reports", subtitle: "Export course and program reports." },
  "/admin/programs-courses/archived": { title: "Archived Courses", subtitle: "View and restore archived courses." },
};

export function ProgramsCoursesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta["/admin/programs-courses/programs"];

  return (
    <div className="space-y-6">
      <AdminPageHeader title={meta.title} subtitle={meta.subtitle} />
      <ProgramsCoursesSubnav />
      {children}
    </div>
  );
}
