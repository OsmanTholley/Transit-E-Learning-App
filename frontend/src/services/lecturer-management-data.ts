import { LecturerNotification, UploadedMaterial } from "@/types/lecturer";

export const lecturerSubmenu = [
  { label: "All Lecturers", sidebarLabel: "All", href: "/admin/lecturers/all" },
  { label: "Add Lecturer", sidebarLabel: "Add", href: "/admin/lecturers/add" },
  { label: "Assign Courses", sidebarLabel: "Assign", href: "/admin/lecturers/assign-courses" },
  { label: "Uploaded Materials", sidebarLabel: "Materials", href: "/admin/lecturers/materials" },
  { label: "Messages", href: "/admin/lecturers/notifications" },
  { label: "Suspended Lecturers", sidebarLabel: "Suspended", href: "/admin/lecturers/suspended" },
  { label: "Lecturer Reports", sidebarLabel: "Reports", href: "/admin/lecturers/reports" },
] as const;

export const accountStatuses = ["Active", "Suspended", "Pending"] as const;
export const verificationStatuses = ["Verified", "Pending", "Rejected"] as const;

export const uploadedMaterials: UploadedMaterial[] = [];

/** @deprecated Legacy mock notifications — use /api/lecturers/messages */
export const lecturerNotifications: LecturerNotification[] = [];
