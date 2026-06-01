import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { startLiveClass, listLecturerLiveClasses } from "@/lib/live-classroom/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const session = await startLiveClass(id, lecturer.id);
    if (!session) {
      return NextResponse.json({ error: "Live class not found." }, { status: 404 });
    }

    const sessions = await listLecturerLiveClasses(lecturer.id);
    return NextResponse.json({ message: "Class is now live.", sessions });
  } catch (error) {
    console.error("POST start live class:", error);
    return NextResponse.json({ error: "Failed to start class." }, { status: 500 });
  }
}
