import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const assignment = await prisma.assignment.findFirst({
      where: { id, lecturerId: lecturer.id },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      orderBy: { submittedAt: "desc" },
      include: {
        student: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title ?? "Assignment",
        course: `${assignment.course.courseCode} – ${assignment.course.courseTitle}`,
      },
      submissions: submissions.map((s) => ({
        id: s.id,
        studentIdCode: s.student.studentId,
        studentName: s.student.user.fullName,
        submittedAt: s.submittedAt.toISOString(),
        fileUrl: s.fileUrl,
        grade: s.grade,
        feedback: s.feedback,
      })),
    });
  } catch (error) {
    console.error("GET submissions:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load submissions." }, { status: 500 });
  }
}
