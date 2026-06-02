import { NextRequest, NextResponse } from "next/server";
import { normalizeAcademicYear } from "@/lib/academic-years";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { syncCourseEnrollments } from "@/lib/course-enrollment";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const courseId = body.courseId?.trim();
    const lecturerId = body.lecturerId?.trim();
    const programId = body.programId?.trim() || null;
    const level = normalizeAcademicYear(body.level);
    const semester = body.semester?.trim() || null;

    if (!courseId || !lecturerId) {
      return NextResponse.json({ error: "Course and lecturer are required." }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: "Year is required." }, { status: 400 });
    }
    if (!semester) {
      return NextResponse.json({ error: "Semester is required." }, { status: 400 });
    }

    const [lecturer, course] = await Promise.all([
      prisma.lecturer.findFirst({
        where: { id: lecturerId, user: { isActive: true } },
        select: { id: true, user: { select: { fullName: true } } },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, courseCode: true, courseTitle: true, departmentId: true },
      }),
    ]);

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer not found or inactive." }, { status: 400 });
    }
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (programId) {
      const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { id: true, departmentId: true, programName: true },
      });
      if (!program) {
        return NextResponse.json({ error: "Program not found." }, { status: 400 });
      }
      if (course.departmentId && program.departmentId && program.departmentId !== course.departmentId) {
        return NextResponse.json(
          { error: "Selected program does not belong to this course's department." },
          { status: 400 }
        );
      }
    }

    await prisma.course.update({
      where: { id: course.id },
      data: {
        lecturerId: lecturer.id,
        programId,
        level,
        semester,
      },
    });

    const enrolled = await syncCourseEnrollments(course.id);

    return NextResponse.json({
      message: `${lecturer.user.fullName} assigned to ${course.courseCode} – ${course.courseTitle}. ${enrolled} student(s) enrolled.`,
    });
  } catch (error) {
    console.error("POST /api/courses/assign:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to assign course." }, { status: 500 });
  }
}
