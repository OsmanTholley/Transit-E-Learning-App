import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { getLecturerCourseOrThrow } from "@/lib/lecturer/course-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const assignments = await prisma.assignment.findMany({
      where: { lecturerId: lecturer.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        _count: { select: { submissions: true } },
      },
    });

    const rows = await Promise.all(
      assignments.map(async (assignment) => {
        const ungraded = await prisma.submission.count({
          where: { assignmentId: assignment.id, grade: null },
        });
        return {
          id: assignment.id,
          title: assignment.title ?? "Untitled assignment",
          courseId: assignment.courseId,
          course: `${assignment.course.courseCode} – ${assignment.course.courseTitle}`,
          instructions: assignment.instructions,
          attachmentUrl: assignment.attachmentUrl,
          dueDate: assignment.dueDate?.toISOString() ?? null,
          submissions: assignment._count.submissions,
          ungraded,
        };
      })
    );

    return NextResponse.json({ assignments: rows });
  } catch (error) {
    console.error("GET /api/lecturer/assignments:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load assignments." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const body = await request.json();
    const courseId = body.courseId?.trim();
    const title = body.title?.trim() || "Assignment";
    const instructions = body.instructions?.trim() || null;
    const attachmentUrl = body.attachmentUrl?.trim() || null;
    const dueDateRaw = body.dueDate?.trim();

    if (!courseId) {
      return NextResponse.json({ error: "Course is required." }, { status: 400 });
    }

    const course = await getLecturerCourseOrThrow(lecturer.id, courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
    if (dueDateRaw && Number.isNaN(dueDate!.getTime())) {
      return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        lecturerId: lecturer.id,
        title,
        instructions,
        attachmentUrl,
        dueDate,
      },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        _count: { select: { submissions: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Assignment created.",
        assignment: {
          id: assignment.id,
          title: assignment.title ?? "Assignment",
          courseId: assignment.courseId,
          course: `${assignment.course.courseCode} – ${assignment.course.courseTitle}`,
          instructions: assignment.instructions,
          attachmentUrl: assignment.attachmentUrl,
          dueDate: assignment.dueDate?.toISOString() ?? null,
          submissions: 0,
          ungraded: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/lecturer/assignments:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to create assignment." }, { status: 500 });
  }
}
