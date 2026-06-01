import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getLectureNoteById } from "@/lib/student-lecture-notes-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const { noteId } = await params;
    const note = await getLectureNoteById(student, noteId);

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("GET /api/student/lecture-notes/[noteId]:", error);
    return NextResponse.json({ error: "Failed to load note." }, { status: 500 });
  }
}
