import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const { id: assignmentId } = await params;
    const body = await request.json();
    const fileUrl = body.fileUrl?.trim();

    if (!fileUrl) {
      return NextResponse.json({ error: "Upload your submission file first." }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true, dueDate: true },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const enrolled = await prisma.courseStudent.findFirst({
      where: { courseId: assignment.courseId, studentId: student.id },
    });
    if (!enrolled) {
      return NextResponse.json({ error: "You are not enrolled in this course." }, { status: 403 });
    }

    const now = new Date();
    const isPastDue = assignment.dueDate != null && now > assignment.dueDate;

    const existing = await prisma.submission.findFirst({
      where: { assignmentId, studentId: student.id },
    });

    if (isPastDue) {
      return NextResponse.json(
        {
          error:
            "The deadline has passed. Late submissions are not accepted for this assignment.",
        },
        { status: 403 }
      );
    }

    if (existing) {
      const updated = await prisma.submission.update({
        where: { id: existing.id },
        data: { fileUrl, submittedAt: new Date() },
      });
      return NextResponse.json({ message: "Submission updated.", submissionId: updated.id });
    }

    const created = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: student.id,
        fileUrl,
      },
    });

    return NextResponse.json(
      { message: "Assignment submitted.", submissionId: created.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST assignment submit:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to submit assignment." }, { status: 500 });
  }
}
