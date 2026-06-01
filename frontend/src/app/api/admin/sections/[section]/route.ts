import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { buildAdminSectionContent } from "@/lib/admin-section-service";
import { handleRouteDatabaseError } from "@/lib/db-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { section } = await params;
    const content = await buildAdminSectionContent(section);
    if (!content) {
      return NextResponse.json({ error: "Section not found." }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("GET /api/admin/sections/[section]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load section." }, { status: 500 });
  }
}
