import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { AttendanceRecord, StudentNotification, VerificationLog } from "@/types/student";

export const studentSubmenu = [
  { label: "All Students",    sidebarLabel: "All",      href: "/admin/students/all" },
  { label: "Add Student",     sidebarLabel: "Add",      href: "/admin/students/add" },
  { label: "Verify Students", sidebarLabel: "Verify",   href: "/admin/students/verify" },
  { label: "Student Programs",sidebarLabel: "Programs", href: "/admin/students/programs" },
  { label: "Attendance",                                href: "/admin/students/attendance" },
  { label: "Messages",                                  href: "/admin/students/notifications" },
  { label: "Student Reports", sidebarLabel: "Reports",  href: "/admin/students/reports" },
] as const;

// Reference values
export const years    = [...ACADEMIC_YEARS];
export const genders  = ["Male", "Female", "Other"] as const;
export const statuses = ["Active", "Suspended", "Pending"] as const;

// All department and program options are fetched live from the database.
// No hardcoded lists — they reflect only what admin has created.

export const verificationLogs:       VerificationLog[]    = [];
export const attendanceRecords:      AttendanceRecord[]    = [];
export const studentNotifications:   StudentNotification[] = [];
