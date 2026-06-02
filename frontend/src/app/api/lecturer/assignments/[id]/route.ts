import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { getLecturerCourseOrThrow } from "@/lib/lecturer/course-access";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const existing = await prisma.assignment.findFirst({
      where: { id, lecturerId: lecturer.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const body = await request.json();
    const courseId = body.courseId?.trim() ?? existing.courseId;
    const title = body.title?.trim() ?? existing.title ?? "Assignment";
    const instructions =
      body.instructions !== undefined
        ? body.instructions?.trim() || null
        : existing.instructions;
    const attachmentUrl =
      body.attachmentUrl !== undefined
        ? body.attachmentUrl?.trim() || null
        : existing.attachmentUrl;
    const dueDateRaw = body.dueDate !== undefined ? body.dueDate?.trim() : undefined;

    const course = await getLecturerCourseOrThrow(lecturer.id, courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    let dueDate = existing.dueDate;
    if (dueDateRaw !== undefined) {
      dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
      if (dueDateRaw && dueDate && Number.isNaN(dueDate.getTime())) {
        return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
      }
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: { courseId, title, instructions, attachmentUrl, dueDate },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        _count: { select: { submissions: true } },
      },
    });

    const ungraded = await prisma.submission.count({
      where: { assignmentId: id, grade: null },
    });

    return NextResponse.json({
      message: "Assignment updated.",
      assignment: {
        id: assignment.id,
        title: assignment.title ?? "Assignment",
        courseId: assignment.courseId,
        course: `${assignment.course.courseCode} – ${assignment.course.courseTitle}`,
        instructions: assignment.instructions,
        attachmentUrl: assignment.attachmentUrl,
        dueDate: assignment.dueDate?.toISOString() ?? null,
        submissions: assignment._count.submissions,
        ungraded,
      },
    });
  } catch (error) {
    console.error("PATCH /api/lecturer/assignments/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update assignment." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const existing = await prisma.assignment.findFirst({
      where: { id, lecturerId: lecturer.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { assignmentId: id } }),
      prisma.assignment.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "Assignment deleted." });
  } catch (error) {
    console.error("DELETE /api/lecturer/assignments/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete assignment." }, { status: 500 });
  }
}
