import { adminNavigation } from "@/services/mock-data";

export type AdminNavChild = { label: string; href: string };

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  children?: AdminNavChild[];
};

export type AdminNavSection =
  | { type: "link"; item: AdminNavItem }
  | { type: "heading"; label: string };

const childSidebarLabels: Record<string, string> = {
  "/admin/students/all": "All",
  "/admin/students/add": "Add",
  "/admin/students/verify": "Verify",
  "/admin/students/programs": "Programs",
  "/admin/students/attendance": "Attendance",
  "/admin/students/notifications": "Messages",
  "/admin/students/reports": "Reports",
  "/admin/lecturers/all": "All",
  "/admin/lecturers/add": "Add",
  "/admin/lecturers/assign-courses": "Assign",
  "/admin/lecturers/materials": "Materials",
  "/admin/lecturers/notifications": "Messages",
  "/admin/lecturers/suspended": "Suspended",
  "/admin/lecturers/reports": "Reports",
  "/admin/departments/all": "All",
  "/admin/departments/add": "Add",
  "/admin/departments/programs": "Programs",
  "/admin/departments/students": "Students",
  "/admin/departments/lecturers": "Lecturers",
  "/admin/departments/notifications": "Notifications",
  "/admin/departments/reports": "Reports",
  "/admin/programs/all": "All",
  "/admin/programs/add": "Add",
  "/admin/programs/reports": "Reports",
  "/admin/courses/all": "All",
  "/admin/courses/add": "Add",
  "/admin/courses/assign": "Assign",
  "/admin/courses/semesters": "Semesters",
  "/admin/courses/categories": "Categories",
  "/admin/courses/reports": "Reports",
  "/admin/content/lecture-notes": "Lecture Notes",
  "/admin/content/videos": "Videos",
  "/admin/content/assignments": "Assignments",
  "/admin/content/quizzes": "Quizzes",
  "/admin/content/discussions": "Discussions",
  "/admin/content/ai-tutor": "AI Tutor",
  "/admin/content/files": "Files",
  "/admin/content/approval": "Approval",
  "/admin/content/reported": "Reported",
  "/admin/content/analytics": "Analytics",
};

const sectionIcons: Record<string, string> = {
  Students: "students",
  Lecturers: "lecturers",
  Departments: "departments",
  Programs: "programs",
  Courses: "courses",
  "Manage Content": "content",
  Assignments: "assignments",
  Quizzes: "quizzes",
  "Live Classes": "live",
  Discussions: "discussions",
  "AI Assistant": "ai",
  Announcements: "announcements",
  Notifications: "notifications",
  "System Settings": "settings",
  "Activity Logs": "logs",
  "YouTube Views": "youtube",
  "Finance & Fees": "finance",
};

function mapChildren(children?: { label: string; href: string }[]) {
  if (!children?.length) return undefined;
  return children.map((child) => ({
    href: child.href,
    label: childSidebarLabels[child.href] ?? child.label,
  }));
}

export const adminNavSections: AdminNavSection[] = [
  {
    type: "link",
    item: {
      label: adminNavigation.dashboard.label,
      href: adminNavigation.dashboard.href,
      icon: "dashboard",
    },
  },
  ...adminNavigation.categories.flatMap((category) => [
    { type: "heading" as const, label: category.label },
    ...category.items.map((item) => ({
      type: "link" as const,
      item: {
        label: item.label,
        href: item.href,
        icon: sectionIcons[item.label] ?? "grid",
        children: mapChildren(item.children),
      },
    })),
  ]),
];
