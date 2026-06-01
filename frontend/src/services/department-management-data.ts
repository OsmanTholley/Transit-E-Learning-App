import { DepartmentNotification, DepartmentRecord, ProgramRecord } from "@/types/department";

export const departmentSubmenu = [
  { label: "All Departments", href: "/admin/departments/all" },
  { label: "Add Department", href: "/admin/departments/add" },
  { label: "Department Students", href: "/admin/departments/students" },
  { label: "Department Lecturers", href: "/admin/departments/lecturers" },
  { label: "Notifications", href: "/admin/departments/notifications" },
  { label: "Department Reports", sidebarLabel: "Reports", href: "/admin/departments/reports" },
] as const;

export const departmentStatuses = ["Active", "Inactive", "Pending"] as const;

export const mockDepartments: DepartmentRecord[] = [
  {
    id: "1",
    name: "Computing Sciences",
    code: "CS",
    description: "Computer science, software engineering, and IT programs.",
    head: "Dr. Ada Lecturer",
    totalPrograms: 3,
    totalStudents: 842,
    totalLecturers: 28,
    totalCourses: 24,
    status: "Active",
    createdAt: "2022-09-01",
  },
  {
    id: "2",
    name: "Public Health",
    code: "PH",
    description: "Community health, epidemiology, and public health policy.",
    head: "Dr. Fatmata Sesay",
    totalPrograms: 2,
    totalStudents: 456,
    totalLecturers: 18,
    totalCourses: 16,
    status: "Active",
    createdAt: "2022-09-01",
  },
  {
    id: "3",
    name: "Business Administration",
    code: "BA",
    description: "Accounting, marketing, procurement, and management.",
    head: "Mr. Ibrahim Koroma",
    totalPrograms: 4,
    totalStudents: 612,
    totalLecturers: 22,
    totalCourses: 20,
    status: "Active",
    createdAt: "2023-01-15",
  },
  {
    id: "4",
    name: "Agriculture",
    code: "AG",
    description: "Sustainable agriculture and food systems.",
    head: "Dr. Aminata Bangura",
    totalPrograms: 2,
    totalStudents: 318,
    totalLecturers: 12,
    totalCourses: 14,
    status: "Active",
    createdAt: "2023-01-15",
  },
  {
    id: "5",
    name: "Mass Communication",
    code: "MC",
    description: "Media studies, journalism, and digital communication.",
    head: "Pending Assignment",
    totalPrograms: 1,
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    status: "Pending",
    createdAt: "2025-05-10",
  },
];

export const mockPrograms: ProgramRecord[] = [
  { id: "p1", name: "BSc Computer Science", department: "Computing Sciences", duration: "4 Years", levels: "Year 1–Year 4", status: "Active" },
  { id: "p2", name: "BSc Software Engineering", department: "Computing Sciences", duration: "4 Years", levels: "Year 1–Year 4", status: "Active" },
  { id: "p3", name: "BSc Public Health", department: "Public Health", duration: "4 Years", levels: "Year 1–Year 4", status: "Active" },
  { id: "p4", name: "BSc Accounting", department: "Business Administration", duration: "4 Years", levels: "Year 1–Year 4", status: "Active" },
  { id: "p5", name: "BSc Marketing", department: "Business Administration", duration: "4 Years", levels: "Year 1–Year 4", status: "Active" },
  { id: "p6", name: "BSc Procurement", department: "Business Administration", duration: "4 Years", levels: "Year 1–Year 4", status: "Active" },
];

export const departmentCourses = [
  { code: "CSC101", title: "Intro to Programming", department: "Computing Sciences", level: "Year 1", semester: "First" },
  { code: "CSC202", title: "Data Structures", department: "Computing Sciences", level: "Year 2", semester: "Second" },
  { code: "CSC305", title: "Web Development", department: "Computing Sciences", level: "Year 3", semester: "First" },
  { code: "PHL201", title: "Community Health", department: "Public Health", level: "Year 2", semester: "First" },
  { code: "ACC210", title: "Financial Accounting", department: "Business Administration", level: "Year 2", semester: "Second" },
];

export const departmentNotifications: DepartmentNotification[] = [
  { id: "dn1", title: "Department meeting – Computing Sciences", audience: "Computing Sciences – All staff", sentAt: "2025-05-28 09:00", status: "Sent" },
  { id: "dn2", title: "Seminar: Public Health Research", audience: "Public Health – Students & Lecturers", sentAt: "2025-05-29 14:00", status: "Scheduled" },
  { id: "dn3", title: "Timetable update", audience: "Business Administration", sentAt: "2025-05-27 11:30", status: "Sent" },
];

export function getDepartmentById(id: string) {
  return mockDepartments.find((d) => d.id === id || d.code.toLowerCase() === id.toLowerCase());
}

export const departmentOverviewStats = {
  totalDepartments: mockDepartments.length,
  totalPrograms: mockPrograms.length,
  totalStudents: mockDepartments.reduce((s, d) => s + d.totalStudents, 0),
  totalLecturers: mockDepartments.reduce((s, d) => s + d.totalLecturers, 0),
};
