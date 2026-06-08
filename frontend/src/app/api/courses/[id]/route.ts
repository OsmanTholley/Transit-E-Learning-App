import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { normalizeAcademicYear } from "@/lib/academic-years";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { mapCourseToRecord } from "@/lib/course-mapper";
import { prisma } from "@/lib/prisma";

const COURSE_INCLUDE = {
  department: { select: { departmentName: true } },
  program:    { select: { programName: true } },
  lecturer:   { select: { user: { select: { fullName: true } } } },
  _count:     { select: { courseStudents: true } },
} as const;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const course = await prisma.course.findUnique({ where: { id }, include: COURSE_INCLUDE });
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

    return NextResponse.json({ course: mapCourseToRecord(course) });
  } catch (error) {
    console.error("GET /api/courses/[id]:", error);
    return NextResponse.json({ error: "Failed to load course." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

    const courseTitle  = body.courseTitle?.trim()  || undefined;
    const courseCode   = body.courseCode?.trim().toUpperCase() || undefined;
    const semester     = body.semester?.trim()     || undefined;
    const lecturerId   = body.lecturerId           !== undefined ? (body.lecturerId?.trim() || null) : undefined;
    const level        = body.level                !== undefined ? normalizeAcademicYear(body.level) : undefined;
    const departmentId = body.departmentId?.trim() || undefined;
    const programId    = body.programId?.trim()    || undefined;
    const description  = body.description          !== undefined ? (body.description?.trim() || null) : undefined;

    if (courseCode && courseCode !== course.courseCode) {
      const dup = await prisma.course.findUnique({ where: { courseCode } });
      if (dup) return NextResponse.json({ error: `Course code "${courseCode}" already exists.` }, { status: 409 });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(courseTitle   !== undefined ? { courseTitle }   : {}),
        ...(courseCode    !== undefined ? { courseCode }    : {}),
        ...(semester      !== undefined ? { semester }      : {}),
        ...(lecturerId    !== undefined ? { lecturerId }    : {}),
        ...(level         !== undefined ? { level }         : {}),
        ...(departmentId  !== undefined ? { departmentId }  : {}),
        ...(programId     !== undefined ? { programId }     : {}),
        ...(description   !== undefined ? { description }   : {}),
      },
      include: COURSE_INCLUDE,
    });

    return NextResponse.json({ message: "Course updated successfully.", course: mapCourseToRecord(updated) });
  } catch (error) {
    console.error("PATCH /api/courses/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { courseStudents: true } } },
    });
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });

    // Remove enrolments first, then delete
    await prisma.courseStudent.deleteMany({ where: { courseId: id } });
    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ message: `"${course.courseTitle}" has been deleted.` });
  } catch (error) {
    console.error("DELETE /api/courses/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
  }
}
