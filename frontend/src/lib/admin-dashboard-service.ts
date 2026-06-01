import { Role } from "@prisma/client";
import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { prisma } from "@/lib/prisma";
import type {
  AdminActivityItem,
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

export async function buildAdminDashboardData(): Promise<AdminDashboardData> {
  const [
    totalStudents,
    totalLecturers,
    activeCourses,
    activeUsers,
    unverifiedLecturers,
    unregisteredAdmitted,
    unassignedCourses,
    courses,
    recentStudentsRaw,
    usersByRole,
    recentUsers,
    recentCourses,
    notesCount,
    quizzesCount,
    assignmentsCount,
    lecturersWithCourses,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.lecturer.count(),
    prisma.course.count({ where: { lecturerId: { not: null } } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.lecturer.count({ where: { isVerified: false } }),
    prisma.admittedStudent.count({ where: { registeredAt: null } }),
    prisma.course.count({ where: { lecturerId: null } }),
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
  ]);

  const pendingApprovals = unverifiedLecturers + unregisteredAdmitted + unassignedCourses;

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

  const activities: AdminActivityItem[] = [];

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

  return {
    stats: {
      totalStudents,
      totalLecturers,
      activeCourses,
      activeUsers,
      pendingApprovals,
    },
    coursesByLevel,
    recentStudents,
    activities: activities.slice(0, 6),
    userDistribution,
    lecturerPerformance,
  };
}
