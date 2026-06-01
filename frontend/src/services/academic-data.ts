import { ACADEMIC_YEARS, ACADEMIC_YEARS_SUMMARY } from "@/lib/academic-years";
import { CourseRecord, ProgramRecord } from "@/types/academic";

export { ACADEMIC_YEARS_SUMMARY };

export const programSubmenu = [
  { label: "All Programs", href: "/admin/programs/all" },
  { label: "Add Program", href: "/admin/programs/add" },
  { label: "Program Reports", href: "/admin/programs/reports" },
] as const;

export const coursesSubmenu = [
  { label: "All Courses", href: "/admin/courses/all" },
  { label: "Add Course", href: "/admin/courses/add" },
  { label: "Assign Courses", href: "/admin/courses/assign" },
  { label: "Course Categories", href: "/admin/courses/categories" },
  { label: "Semester Management", href: "/admin/courses/semesters" },
  { label: "Course Reports", sidebarLabel: "Reports", href: "/admin/courses/reports" },
] as const;

export const departments = ["Computing Sciences", "Public Health", "Business Administration", "Agriculture"];
export const programNames = ["BSc Computer Science", "Diploma in IT", "BSc Public Health", "BSc Accounting"];
export const levels = [...ACADEMIC_YEARS];
export const semesters = ["Semester 1", "Semester 2"];

export const mockPrograms: ProgramRecord[] = [
  { id: "1", name: "BSc Computer Science", department: "Computing Sciences", duration: "4 Years", totalStudents: 512, totalCourses: 24, status: "Active" },
  { id: "2", name: "Diploma in IT", department: "Computing Sciences", duration: "2 Years", totalStudents: 186, totalCourses: 12, status: "Active" },
  { id: "3", name: "BSc Public Health", department: "Public Health", duration: "4 Years", totalStudents: 456, totalCourses: 16, status: "Active" },
  { id: "4", name: "BSc Accounting", department: "Business Administration", duration: "4 Years", totalStudents: 298, totalCourses: 14, status: "Active" },
];

export const mockCourses: CourseRecord[] = [
  { id: "1", code: "CSC101", title: "Intro to Programming", department: "Computing Sciences", program: "BSc Computer Science", lecturer: "Dr. Ada Lecturer", level: "Year 1", semester: "Semester 1", totalStudents: 128, status: "Active" },
  { id: "2", code: "CSC301", title: "Database Systems", department: "Computing Sciences", program: "BSc Computer Science", lecturer: "Mr. James Kamara", level: "Year 3", semester: "Semester 1", totalStudents: 97, status: "Active" },
  { id: "3", code: "CSC202", title: "Data Structures", department: "Computing Sciences", program: "BSc Computer Science", lecturer: "Dr. Ada Lecturer", level: "Year 2", semester: "Semester 2", totalStudents: 112, status: "Active" },
  { id: "4", code: "PHL201", title: "Community Health", department: "Public Health", program: "BSc Public Health", lecturer: "Dr. Fatmata Sesay", level: "Year 2", semester: "Semester 1", totalStudents: 88, status: "Pending" },
  { id: "5", code: "ACC210", title: "Financial Accounting", department: "Business Administration", program: "BSc Accounting", lecturer: "Mr. Ibrahim Koroma", level: "Year 2", semester: "Semester 2", totalStudents: 76, status: "Active" },
  { id: "6", code: "CSC199", title: "Legacy Computing", department: "Computing Sciences", program: "Diploma in IT", lecturer: "—", level: "Year 1", semester: "Semester 1", totalStudents: 0, status: "Archived" },
];

export const courseCategories = ["Core", "Elective", "General Studies", "Practical", "Research"];

export const programOverviewStats = {
  totalPrograms: mockPrograms.length,
  activePrograms: mockPrograms.filter((p) => p.status === "Active").length,
  totalStudents: mockPrograms.reduce((s, p) => s + p.totalStudents, 0),
};

export const courseOverviewStats = {
  totalCourses: mockCourses.filter((c) => c.status !== "Archived").length,
  activeCourses: mockCourses.filter((c) => c.status === "Active").length,
  archivedCourses: mockCourses.filter((c) => c.status === "Archived").length,
  pendingCourses: mockCourses.filter((c) => c.status === "Pending").length,
};

/** @deprecated Legacy combined stats for old programs-courses pages */
export const academicOverviewStats = {
  totalPrograms: programOverviewStats.totalPrograms,
  activeCourses: courseOverviewStats.activeCourses,
  totalCourses: courseOverviewStats.totalCourses,
  archivedCourses: courseOverviewStats.archivedCourses,
};
