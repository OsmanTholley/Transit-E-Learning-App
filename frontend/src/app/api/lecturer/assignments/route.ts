import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
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
          course: `${assignment.course.courseCode} – ${assignment.course.courseTitle}`,
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
