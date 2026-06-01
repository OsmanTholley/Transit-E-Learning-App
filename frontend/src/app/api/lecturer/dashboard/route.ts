import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { buildLecturerDashboardData } from "@/lib/lecturer-portal-service";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const data = await buildLecturerDashboardData(lecturer.id);
    if (!data) {
      return NextResponse.json({ error: "Lecturer profile not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/lecturer/dashboard:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
