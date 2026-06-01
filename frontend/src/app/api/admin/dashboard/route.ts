import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { buildAdminDashboardData } from "@/lib/admin-dashboard-service";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const data = await buildAdminDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/admin/dashboard:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
