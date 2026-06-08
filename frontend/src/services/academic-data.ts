import { ACADEMIC_YEARS, ACADEMIC_YEARS_SUMMARY } from "@/lib/academic-years";

export { ACADEMIC_YEARS_SUMMARY };

// ── Navigation config (used by sub-nav components) ──────────────
export const programSubmenu = [
  { label: "All Programs", href: "/admin/programs/all" },
  { label: "Add Program",  href: "/admin/programs/add" },
  { label: "Program Reports", href: "/admin/programs/reports" },
] as const;

export const coursesSubmenu = [
  { label: "All Courses",       href: "/admin/courses/all" },
  { label: "Add Course",        href: "/admin/courses/add" },
  { label: "Assign Courses",    href: "/admin/courses/assign" },
  { label: "Course Categories", href: "/admin/courses/categories" },
  { label: "Semester Management", href: "/admin/courses/semesters" },
  { label: "Course Reports",    sidebarLabel: "Reports", href: "/admin/courses/reports" },
] as const;

// ── Reference values (sourced from DB; these are only UI helpers) ─
export const levels    = [...ACADEMIC_YEARS];
export const semesters = ["Semester 1", "Semester 2"];

// ── Category options for course form (non-entity, safe to keep) ──
export const courseCategories = ["Core", "Elective", "General Studies", "Practical", "Research"];
