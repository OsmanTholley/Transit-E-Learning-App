import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { submitQuizAttempt } from "@/lib/student-quizzes-data";
import type { QuizSubmitAnswer } from "@/types/student-quizzes";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const { quizId } = await params;
    const body = await request.json();
    const answers = (body.answers ?? []) as QuizSubmitAnswer[];
    const timeUsedSeconds = Number(body.timeUsedSeconds ?? 0);
    const practiceMode = Boolean(body.practiceMode);

    const result = await submitQuizAttempt(
      student.userId,
      quizId,
      answers,
      timeUsedSeconds,
      practiceMode
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/student/quizzes/[quizId]/submit:", error);
    return NextResponse.json({ error: "Failed to submit quiz." }, { status: 500 });
  }
}
