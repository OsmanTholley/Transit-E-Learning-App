import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { getLecturerVideoAnalytics } from "@/lib/lecturer-video-analytics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const analytics = await getLecturerVideoAnalytics(lecturer.id, id);
    if (!analytics) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("GET /api/lecturer/videos/[id]/analytics:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load video analytics." }, { status: 500 });
  }
}
