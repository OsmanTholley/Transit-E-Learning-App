import { Role } from "@prisma/client";
import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { listActivityLogs } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import type {
  AdminActivityItem,
  AdminChartPoint,
  AdminDashboardCharts,
  AdminDashboardData,
  AdminRecentStudent,
} from "@/types/admin-dashboard";

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function studentStatus(isActive: boolean): string {
  return isActive ? "Active" : "Suspended";
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function buildEnrollmentTrend(createdDates: Date[]): AdminChartPoint[] {
  const now = new Date();
  const months: AdminChartPoint[] = [];

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: monthLabel(monthKey(date)), value: 0 });
  }

  const monthIndex = new Map(months.map((m, index) => [m.label, index]));

  for (const createdAt of createdDates) {
    const label = monthLabel(monthKey(createdAt));
    const index = monthIndex.get(label);
    if (index !== undefined) {
      months[index].value += 1;
    }
  }

  return months;
}

const chartColors = ["#0d9488", "#14b8a6", "#0ea5e9", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"];

export async function buildAdminDashboardData(): Promise<AdminDashboardData> {
  const [
    totalStudents,
    totalLecturers,
    activeCourses,
    activeUsers,
    courses,
    recentStudentsRaw,
    usersByRole,
    recentUsers,
    recentCourses,
    notesCount,
    quizzesCount,
    assignmentsCount,
    lecturersWithCourses,
    studentsWithDepartments,
    studentCreatedDates,
    videosCount,
    departments,
    studentsByGenderRaw,
    recentAuditLogs,
    discussionsCount,
    notificationsCount,
    unreadNotificationsCount,
    studentBroadcastsCount,
    lecturerBroadcastsCount,
    unverifiedLecturers,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.lecturer.count(),
    prisma.course.count({ where: { lecturerId: { not: null } } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.course.findMany({
      select: { level: true, lecturerId: true },
    }),
    prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, isActive: true } },
        program: { select: { programName: true } },
      },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
      where: { isActive: true },
    }),
    prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      where: { role: Role.STUDENT },
      include: { student: { select: { studentId: true } } },
    }),
    prisma.course.findMany({
      take: 2,
      orderBy: { createdAt: "desc" },
      select: { courseTitle: true, courseCode: true, createdAt: true },
    }),
    prisma.lectureNote.count(),
    prisma.quiz.count(),
    prisma.assignment.count(),
    prisma.lecturer.findMany({
      include: {
        user: { select: { fullName: true } },
        _count: { select: { courses: true } },
      },
      take: 10,
    }),
    prisma.student.findMany({
      select: {
        departmentId: true,
        department: { select: { departmentName: true } },
      },
    }),
    prisma.student.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.video.count(),
    prisma.department.findMany({ select: { id: true, departmentName: true } }),
    prisma.student.groupBy({
      by: ["gender"],
      _count: { gender: true },
    }),
    listActivityLogs(8),
    prisma.discussion.count(),
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.studentMessageBroadcast.count(),
    prisma.lecturerMessageBroadcast.count(),
    prisma.lecturer.count({ where: { isVerified: false } }),
  ]);

  const levelCounts = new Map<string, number>();
  for (const year of ACADEMIC_YEARS) {
    levelCounts.set(year, 0);
  }
  for (const course of courses) {
    if (!course.lecturerId) continue;
    const level = course.level?.trim() || "Unassigned";
    levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1);
  }

  const coursesByLevel = [...levelCounts.entries()].map(([level, count]) => ({
    level,
    count,
  }));

  const recentStudents: AdminRecentStudent[] = recentStudentsRaw.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    name: s.user.fullName,
    program: s.program?.programName ?? "—",
    status: studentStatus(s.user.isActive),
  }));

  const roleCounts = {
    students: usersByRole.find((r) => r.role === Role.STUDENT)?._count.role ?? 0,
    lecturers: usersByRole.find((r) => r.role === Role.LECTURER)?._count.role ?? 0,
    admins: usersByRole.find((r) => r.role === Role.ADMIN)?._count.role ?? 0,
  };
  const roleTotal = roleCounts.students + roleCounts.lecturers + roleCounts.admins || 1;

  const userDistribution = [
    {
      label: "Students",
      count: roleCounts.students,
      pct: Math.round((roleCounts.students / roleTotal) * 1000) / 10,
    },
    {
      label: "Lecturers",
      count: roleCounts.lecturers,
      pct: Math.round((roleCounts.lecturers / roleTotal) * 1000) / 10,
    },
    {
      label: "Admins",
      count: roleCounts.admins,
      pct: Math.round((roleCounts.admins / roleTotal) * 1000) / 10,
    },
  ];

  const actionTone = (action: string): AdminActivityItem["tone"] => {
    if (action.startsWith("auth.")) return "violet";
    if (action.startsWith("announcement.")) return "emerald";
    if (action.startsWith("student.")) return "blue";
    if (action.includes("settings")) return "amber";
    return "slate";
  };

  const actionTitle = (action: string): string => {
    const labels: Record<string, string> = {
      "auth.login": "User signed in",
      "auth.logout": "User signed out",
      "announcement.sent": "Announcement sent",
      "student.updated": "Student record updated",
      "student.created": "Student registered",
      "student.admitted": "Student admitted",
      "settings.updated": "Settings changed",
    };
    return labels[action] ?? action.replace(/\./g, " · ");
  };

  const activities: AdminActivityItem[] = recentAuditLogs.map((log) => ({
    title: actionTitle(log.action),
    subtitle: log.summary ?? `${log.actorName} (${log.actorRole})`,
    when: relativeTime(new Date(log.createdAt)),
    tone: actionTone(log.action),
  }));

  if (activities.length === 0) {
    for (const user of recentUsers) {
      activities.push({
        title: "New student registered",
        subtitle: `${user.fullName} (${user.student?.studentId ?? "—"})`,
        when: relativeTime(user.createdAt),
        tone: "blue",
      });
    }

    for (const course of recentCourses) {
      activities.push({
        title: "Course updated",
        subtitle: `${course.courseTitle} — ${course.courseCode}`,
        when: relativeTime(course.createdAt),
        tone: "emerald",
      });
    }

    if (unverifiedLecturers > 0) {
      activities.push({
        title: "Lecturers pending verification",
        subtitle: `${unverifiedLecturers} account${unverifiedLecturers === 1 ? "" : "s"} awaiting approval`,
        when: "Pending",
        tone: "amber",
      });
    }
  }

  const lecturerPerformance = {
    activeLecturers: await prisma.lecturer.count({
      where: { user: { isActive: true } },
    }),
    notesUploaded: notesCount,
    quizzesCreated: quizzesCount,
    assignmentsCount,
    topLecturers: [...lecturersWithCourses]
      .sort((a, b) => b._count.courses - a._count.courses)
      .slice(0, 3)
      .map((l) => ({
        name: l.user.fullName,
        courseCount: l._count.courses,
      })),
  };

  const departmentCounts = new Map<string, number>();
  for (const department of departments) {
    departmentCounts.set(department.departmentName, 0);
  }
  let unassignedStudents = 0;
  for (const student of studentsWithDepartments) {
    if (student.department?.departmentName) {
      const name = student.department.departmentName;
      departmentCounts.set(name, (departmentCounts.get(name) ?? 0) + 1);
    } else {
      unassignedStudents += 1;
    }
  }

  const studentsByDepartment: AdminChartPoint[] = [...departmentCounts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], index) => ({
      label,
      value,
      color: chartColors[index % chartColors.length],
    }));

  if (unassignedStudents > 0) {
    studentsByDepartment.push({
      label: "Unassigned",
      value: unassignedStudents,
      color: "#94a3b8",
    });
  }

  const genderColors: Record<string, string> = {
    Male: "#0ea5e9",
    Female: "#ec4899",
    Other: "#8b5cf6",
    Unspecified: "#94a3b8",
  };

  const studentsByGender: AdminChartPoint[] = studentsByGenderRaw
    .map((row) => ({
      label: row.gender?.trim() || "Unspecified",
      value: row._count.gender,
      color: genderColors[row.gender?.trim() || "Unspecified"] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  const charts: AdminDashboardCharts = {
    enrollmentTrend: buildEnrollmentTrend(studentCreatedDates.map((s) => s.createdAt)),
    studentsByGender,
    studentsByDepartment,
    contentOverview: [
      { label: "Notes", value: notesCount, color: "#0d9488" },
      { label: "Videos", value: videosCount, color: "#0ea5e9" },
      { label: "Quizzes", value: quizzesCount, color: "#6366f1" },
      { label: "Assignments", value: assignmentsCount, color: "#f59e0b" },
    ],
    coursesByLevel: coursesByLevel.map((row, index) => ({
      label: row.level,
      value: row.count,
      color: chartColors[index % chartColors.length],
    })),
    usersByRole: [
      { label: "Students", value: roleCounts.students, color: "#0ea5e9" },
      { label: "Lecturers", value: roleCounts.lecturers, color: "#0d9488" },
      { label: "Admins", value: roleCounts.admins, color: "#6366f1" },
    ],
  };

  return {
    stats: {
      totalStudents,
      totalLecturers,
      activeCourses,
      activeUsers,
    },
    coursesByLevel,
    recentStudents,
    activities: activities.slice(0, 6),
    userDistribution,
    lecturerPerformance,
    engagement: {
      discussions: discussionsCount,
      notifications: notificationsCount,
      unreadNotifications: unreadNotificationsCount,
      announcements: studentBroadcastsCount + lecturerBroadcastsCount,
      engagementIndex: discussionsCount + quizzesCount + assignmentsCount,
    },
    charts,
  };
}
