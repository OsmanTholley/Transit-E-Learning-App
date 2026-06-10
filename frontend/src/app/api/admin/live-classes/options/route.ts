import { NextRequest, NextResponse } from "next/server";
import { getActiveLecturerOptions } from "@/lib/admin-academic-options";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const courseId = request.nextUrl.searchParams.get("courseId");

    const [courses, lecturers] = await Promise.all([
      prisma.course.findMany({
        orderBy: { courseCode: "asc" },
        select: {
          id: true,
          courseCode: true,
          courseTitle: true,
          lecturerId: true,
          lecturer: { select: { user: { select: { fullName: true } } } },
          _count: { select: { courseStudents: true } },
        },
      }),
      getActiveLecturerOptions(),
    ]);

    let students: { id: string; studentId: string; fullName: string }[] = [];
    if (courseId) {
      const enrollments = await prisma.courseStudent.findMany({
        where: { courseId },
        include: {
          student: {
            include: { user: { select: { fullName: true } } },
          },
        },
        orderBy: { student: { user: { fullName: "asc" } } },
      });
      students = enrollments.map(({ student }) => ({
        id: student.id,
        studentId: student.studentId,
        fullName: student.user.fullName,
      }));
    }

    return NextResponse.json({
      courses: courses.map((course) => ({
        id: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        lecturerId: course.lecturerId,
        lecturerName: course.lecturer?.user.fullName ?? null,
        studentCount: course._count.courseStudents,
      })),
      lecturers,
      students,
    });
  } catch (error) {
    console.error("GET /api/admin/live-classes/options:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load options." }, { status: 500 });
  }
}
