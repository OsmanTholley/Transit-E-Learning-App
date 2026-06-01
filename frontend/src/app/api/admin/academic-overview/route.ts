import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { buildAcademicOverview } from "@/lib/admin-academic-overview-service";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const data = await buildAcademicOverview();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/admin/academic-overview:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load academic overview." }, { status: 500 });
  }
}
