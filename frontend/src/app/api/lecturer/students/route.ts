import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { getStudentsForLecturer } from "@/lib/lecturer-students-service";

export async function GET(request: Request) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId")?.trim() || undefined;

    const students = await getStudentsForLecturer(lecturer.id, courseId);

    return NextResponse.json({ students });
  } catch (error) {
    console.error("GET /api/lecturer/students:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load students." }, { status: 500 });
  }
}
