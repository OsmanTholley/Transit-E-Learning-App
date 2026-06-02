import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const grade = body.grade?.trim() || null;
    const feedback = body.feedback?.trim() || null;

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        assignment: { lecturerId: lecturer.id },
      },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: { grade, feedback },
    });

    return NextResponse.json({
      message: "Grade saved.",
      submission: {
        id: updated.id,
        grade: updated.grade,
        feedback: updated.feedback,
      },
    });
  } catch (error) {
    console.error("PATCH submission:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to save grade." }, { status: 500 });
  }
}
