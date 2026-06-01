import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { buildLecturerAdminDetail } from "@/lib/lecturer-portal-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const detail = await buildLecturerAdminDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Lecturer not found." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("GET /api/lecturers/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load lecturer." }, { status: 500 });
  }
}
