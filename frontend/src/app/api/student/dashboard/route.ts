import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { syncEnrollmentsForStudents } from "@/lib/course-enrollment";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { getAccessibleCourseIdsForStudent } from "@/lib/student-courses-data";
import { buildStudentDashboardData } from "@/lib/student-dashboard-mapper";
import { countUnreadNotifications } from "@/lib/student-notifications-service";

export async function GET() {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
        department: true,
        program: true,
        courseStudents: {
          include: {
            course: {
              include: {
                assignments: { select: { id: true } },
                quizzes: { select: { id: true } },
              },
            },
          },
        },
        submissions: { select: { assignmentId: true } },
        quizAttempts: { select: { quizId: true, score: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    if (
      student.courseStudents.length === 0 &&
      (student.departmentId || student.programId)
    ) {
      await syncEnrollmentsForStudents([student.id]);
      const refreshed = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          user: true,
          department: true,
          program: true,
          courseStudents: {
            include: {
              course: {
                include: {
                  assignments: { select: { id: true } },
                  quizzes: { select: { id: true } },
                },
              },
            },
          },
          submissions: { select: { assignmentId: true } },
          quizAttempts: { select: { quizId: true, score: true } },
        },
      });
      if (refreshed) Object.assign(student, refreshed);
    }

    const courseIds = await getAccessibleCourseIdsForStudent(student.id, student);

    const accessibleCourses =
      courseIds.length > 0
        ? await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: {
              id: true,
              courseTitle: true,
              courseCode: true,
              assignments: { select: { id: true } },
              quizzes: { select: { id: true } },
            },
          })
        : [];

    const [assignments, lectureNotes, videos, unreadNotifications, quizAttemptsWithMax] = await Promise.all([
      courseIds.length
        ? prisma.assignment.findMany({
            where: { courseId: { in: courseIds } },
            include: { course: { select: { courseTitle: true } } },
            orderBy: { dueDate: "asc" },
          })
        : Promise.resolve([]),
      courseIds.length
        ? prisma.lectureNote.findMany({
            where: { courseId: { in: courseIds } },
            include: {
              course: { select: { courseTitle: true, courseCode: true } },
              lecturer: { include: { user: { select: { fullName: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          })
        : Promise.resolve([]),
      courseIds.length
        ? prisma.video.findMany({
            where: { courseId: { in: courseIds } },
            include: {
              course: { select: { courseTitle: true, courseCode: true } },
              lecturer: { include: { user: { select: { fullName: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          })
        : Promise.resolve([]),
      countUnreadNotifications(user.id),
      prisma.quizAttempt.findMany({
        where: { studentId: student.id, score: { not: null } },
        select: { score: true },
      }),
    ]);

    const quizAverage =
      quizAttemptsWithMax.length > 0
        ? Math.round(
            quizAttemptsWithMax.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) /
              quizAttemptsWithMax.length
          )
        : 0;

    const data = buildStudentDashboardData(
      { ...student, accessibleCourses },
      assignments,
      lectureNotes,
      videos,
      unreadNotifications,
      quizAverage
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/student/dashboard:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
