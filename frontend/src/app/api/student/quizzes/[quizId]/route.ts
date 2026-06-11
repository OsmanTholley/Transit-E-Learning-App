import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getQuizDetailForStudent } from "@/lib/student-quizzes-data";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const locked = await buildFeeLockResponse(student.id, "general");
    if (locked) return locked;

    const { quizId } = await params;
    const quiz = await getQuizDetailForStudent(student.userId, quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("GET /api/student/quizzes/[quizId]:", error);
    return NextResponse.json({ error: "Failed to load quiz." }, { status: 500 });
  }
}
