import { DepartmentNotification } from "@/types/department";

export const departmentSubmenu = [
  { label: "All Departments",      href: "/admin/departments/all" },
  { label: "Add Department",       href: "/admin/departments/add" },
  { label: "Department Students",  href: "/admin/departments/students" },
  { label: "Department Lecturers", href: "/admin/departments/lecturers" },
  { label: "Notifications",        href: "/admin/departments/notifications" },
  { label: "Department Reports",   sidebarLabel: "Reports", href: "/admin/departments/reports" },
] as const;

export const departmentStatuses = ["Active", "Inactive", "Pending"] as const;

// All department, program, and course data is loaded from the database.
// There are no static mock records here — they are fetched via the admin API.

export const departmentNotifications: DepartmentNotification[] = [];
