import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { syncCourseEnrollments } from "@/lib/course-enrollment";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const { lecturerId, courseId } = body;

    if (!lecturerId?.trim() || !courseId?.trim()) {
      return NextResponse.json({ error: "Lecturer and course are required." }, { status: 400 });
    }

    const [lecturer, course] = await Promise.all([
      prisma.lecturer.findFirst({
        where: { id: lecturerId.trim(), user: { isActive: true } },
        select: { id: true, user: { select: { fullName: true } } },
      }),
      prisma.course.findUnique({
        where: { id: courseId.trim() },
        select: { id: true, courseCode: true, courseTitle: true },
      }),
    ]);

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer not found or inactive." }, { status: 400 });
    }
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    await prisma.course.update({
      where: { id: course.id },
      data: { lecturerId: lecturer.id },
    });

    const enrolled = await syncCourseEnrollments(course.id);

    return NextResponse.json({
      message: `${lecturer.user.fullName} assigned to ${course.courseCode} – ${course.courseTitle}. ${enrolled} student(s) enrolled.`,
    });
  } catch (error) {
    console.error("POST /api/lecturers/assign:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to assign course." }, { status: 500 });
  }
}
