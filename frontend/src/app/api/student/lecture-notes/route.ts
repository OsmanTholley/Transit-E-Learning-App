import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getLectureNotesForStudent } from "@/lib/student-lecture-notes-data";

export async function GET() {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const data = await getLectureNotesForStudent(student);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/student/lecture-notes:", error);
    return NextResponse.json({ error: "Failed to load lecture notes." }, { status: 500 });
  }
}
