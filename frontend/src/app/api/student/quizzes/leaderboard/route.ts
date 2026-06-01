import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getLeaderboardForStudent } from "@/lib/student-quizzes-data";

export async function GET() {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const entries = await getLeaderboardForStudent(student.userId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/student/quizzes/leaderboard:", error);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
  }
}
