import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { notifyContentPublished } from "@/lib/content-notify";
import { getLecturerCourseOrThrow } from "@/lib/lecturer/course-access";
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
        _count: { select: { quizAttempts: true, questions: true } },
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
          questionCount: quiz._count.questions,
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

type QuestionInput = {
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  marks?: number;
};

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const body = await request.json();
    const courseId = body.courseId?.trim();
    const title = body.title?.trim() || "Quiz";
    const instructions = body.instructions?.trim() || null;
    const durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : null;
    const questions = (body.questions ?? []) as QuestionInput[];

    if (!courseId) {
      return NextResponse.json({ error: "Course is required." }, { status: 400 });
    }
    if (questions.length === 0) {
      return NextResponse.json({ error: "Add at least one question." }, { status: 400 });
    }

    const course = await getLecturerCourseOrThrow(lecturer.id, courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const totalMarks = questions.reduce((s, q) => s + (q.marks ?? 1), 0);

    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        lecturerId: lecturer.id,
        title,
        instructions,
        durationMinutes,
        totalMarks,
        questions: {
          create: questions.map((q) => ({
            question: q.question.trim(),
            optionA: q.optionA?.trim() || null,
            optionB: q.optionB?.trim() || null,
            optionC: q.optionC?.trim() || null,
            optionD: q.optionD?.trim() || null,
            correctAnswer: q.correctAnswer?.trim().toUpperCase() || null,
            marks: q.marks ?? 1,
          })),
        },
      },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        _count: { select: { quizAttempts: true, questions: true } },
      },
    });

    const courseLabel = `${quiz.course.courseCode} – ${quiz.course.courseTitle}`;
    const notified = await notifyContentPublished(courseId, courseLabel, title, "quiz");

    return NextResponse.json(
      {
        message: `Quiz created. ${notified.students} student(s) and ${notified.admins} admin(s) notified.`,
        quiz: {
          id: quiz.id,
          title: quiz.title ?? "Quiz",
          course: `${quiz.course.courseCode} – ${quiz.course.courseTitle}`,
          attempts: 0,
          averageScore: 0,
          questionCount: quiz._count.questions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/lecturer/quizzes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to create quiz." }, { status: 500 });
  }
}
