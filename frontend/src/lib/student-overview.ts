import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function buildStudentOverview(studentUuid: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentUuid },
    select: { id: true, userId: true, studentId: true },
  });

  if (!student) {
    return null;
  }

  const [
    enrollments,
    quizAttempts,
    submissions,
    attendanceRows,
    unreadNotifications,
    aiSessions,
    lastAiSession,
  ] = await Promise.all([
    prisma.courseStudent.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          select: { courseCode: true, courseTitle: true, id: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 10,
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: student.id, score: { not: null } },
      select: { score: true },
    }),
    prisma.submission.findMany({
      where: { studentId: student.id },
      select: { grade: true, assignmentId: true },
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      select: { status: true },
    }),
    prisma.notification.count({
      where: { userId: student.userId, isRead: false },
    }),
    prisma.aiChatHistory.count({
      where: { studentId: student.id },
    }),
    prisma.aiChatHistory.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  const totalAssignments =
    enrolledCourseIds.length > 0
      ? await prisma.assignment.count({
          where: { courseId: { in: enrolledCourseIds } },
        })
      : 0;

  const submittedCount = submissions.length;
  const pendingCount = Math.max(0, totalAssignments - submittedCount);

  const quizScores = quizAttempts.map((a) => a.score).filter((s): s is number => s !== null);
  const quizAverage =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((sum, s) => sum + s, 0) / quizScores.length)
      : null;

  const presentCount = attendanceRows.filter(
    (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE,
  ).length;
  const attendanceRate =
    attendanceRows.length > 0 ? Math.round((presentCount / attendanceRows.length) * 100) : null;

  const courses = enrollments.map((e) => ({
    id: e.course.id,
    code: e.course.courseCode,
    title: e.course.courseTitle,
    enrolledAt: e.enrolledAt.toISOString(),
  }));

  return {
    courses,
    quizAverage,
    quizCount: quizAttempts.length,
    submissions: { submitted: submittedCount, pending: pendingCount, total: totalAssignments },
    attendanceRate,
    attendanceSessions: attendanceRows.length,
    unreadNotifications,
    aiQuestions: aiSessions,
    lastAiActiveAt: lastAiSession?.createdAt.toISOString() ?? null,
  };
}
