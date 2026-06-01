import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { listQuizzesForStudent } from "@/lib/student-quizzes-data";

export async function GET(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const inProgress = request.nextUrl.searchParams.get("inProgress");
    const inProgressIds = inProgress ? inProgress.split(",").filter(Boolean) : [];

    const quizzes = await listQuizzesForStudent(student.userId, inProgressIds);
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("GET /api/student/quizzes:", error);
    return NextResponse.json({ error: "Failed to load quizzes." }, { status: 500 });
  }
}
