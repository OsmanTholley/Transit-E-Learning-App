import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getLectureNotesForStudent } from "@/lib/student-lecture-notes-data";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";

export async function GET() {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const locked = await buildFeeLockResponse(student.id, "materials");
    if (locked) return locked;

    const data = await getLectureNotesForStudent(student);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/student/lecture-notes:", error);
    return NextResponse.json({ error: "Failed to load lecture notes." }, { status: 500 });
  }
}
