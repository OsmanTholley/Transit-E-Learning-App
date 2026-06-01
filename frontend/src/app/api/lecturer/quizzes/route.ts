import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const quizzes = await prisma.quiz.findMany({
      where: { lecturerId: lecturer.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        _count: { select: { quizAttempts: true } },
      },
    });

    const rows = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await prisma.quizAttempt.findMany({
          where: { quizId: quiz.id, score: { not: null } },
          select: { score: true },
        });
        const average =
          attempts.length > 0
            ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length)
            : 0;

        return {
          id: quiz.id,
          title: quiz.title ?? "Untitled quiz",
          course: `${quiz.course.courseCode} – ${quiz.course.courseTitle}`,
          attempts: quiz._count.quizAttempts,
          averageScore: average,
        };
      })
    );

    return NextResponse.json({ quizzes: rows });
  } catch (error) {
    console.error("GET /api/lecturer/quizzes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load quizzes." }, { status: 500 });
  }
}
