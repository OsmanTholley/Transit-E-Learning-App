import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { buildAdminContentData } from "@/lib/admin-content-service";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const data = await buildAdminContentData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/admin/content:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load content." }, { status: 500 });
  }
}
