import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId")?.trim();

    const enrollments = await prisma.courseStudent.findMany({
      where: {
        course: {
          lecturerId: lecturer.id,
          ...(courseId ? { id: courseId } : {}),
        },
      },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            department: { select: { departmentName: true } },
            program: { select: { programName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      students: enrollments.map((e) => ({
        id: e.student.id,
        studentIdCode: e.student.studentId,
        fullName: e.student.user.fullName,
        email: e.student.user.email ?? "—",
        course: `${e.course.courseCode} – ${e.course.courseTitle}`,
        department: e.student.department?.departmentName ?? "—",
        program: e.student.program?.programName ?? "—",
        enrolledAt: e.enrolledAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/lecturer/students:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load students." }, { status: 500 });
  }
}
