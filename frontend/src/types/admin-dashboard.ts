export type AdminDashboardStats = {
  totalStudents: number;
  totalLecturers: number;
  activeCourses: number;
  activeUsers: number;
  pendingApprovals: number;
};

export type AdminCourseYearCount = {
  level: string;
  count: number;
};

export type AdminRecentStudent = {
  id: string;
  studentId: string;
  name: string;
  program: string;
  status: string;
};

export type AdminActivityItem = {
  title: string;
  subtitle: string;
  when: string;
  tone?: "emerald" | "blue" | "amber" | "violet" | "slate";
};

export type AdminUserDistribution = {
  label: string;
  count: number;
  pct: number;
};

export type AdminLecturerPerformance = {
  activeLecturers: number;
  notesUploaded: number;
  quizzesCreated: number;
  assignmentsCount: number;
  topLecturers: { name: string; courseCount: number }[];
};

export type AdminDashboardData = {
  stats: AdminDashboardStats;
  coursesByLevel: AdminCourseYearCount[];
  recentStudents: AdminRecentStudent[];
  activities: AdminActivityItem[];
  userDistribution: AdminUserDistribution[];
  lecturerPerformance: AdminLecturerPerformance;
};
