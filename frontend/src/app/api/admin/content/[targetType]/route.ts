import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import {
  createAdminContent,
  parseAdminContentTarget,
} from "@/lib/admin-content-crud";
import { handleRouteDatabaseError } from "@/lib/db-errors";

type Params = { params: Promise<{ targetType: string }> };

/** POST /api/admin/content/[targetType] — create content on behalf of a lecturer */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { targetType: slug } = await params;
    const targetType = parseAdminContentTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const body = await request.json();
    const result = await createAdminContent(targetType, body);
    if ("error" in result) {
      const status = result.error.includes("required") ? 400 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(
      { message: result.message, item: result.item },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST admin content:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to create content." }, { status: 500 });
  }
}
