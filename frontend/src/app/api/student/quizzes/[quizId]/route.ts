import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getQuizDetailForStudent } from "@/lib/student-quizzes-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

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
