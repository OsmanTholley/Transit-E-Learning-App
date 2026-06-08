import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import {
  deleteAdminContent,
  getAdminContentDetail,
  parseAdminContentTarget,
  updateAdminContent,
} from "@/lib/admin-content-crud";
import { handleRouteDatabaseError } from "@/lib/db-errors";

type Params = { params: Promise<{ targetType: string; targetId: string }> };

/** GET /api/admin/content/[targetType]/[targetId] — load full record for edit forms */
export async function GET(_request: Request, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { targetType: slug, targetId } = await params;
    const targetType = parseAdminContentTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const result = await getAdminContentDetail(targetType, targetId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ item: result.item });
  } catch (error) {
    console.error("GET admin content:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load content." }, { status: 500 });
  }
}

/** PATCH /api/admin/content/[targetType]/[targetId] — partial update; send only fields to change */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { targetType: slug, targetId } = await params;
    const targetType = parseAdminContentTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const body = await request.json();
    const result = await updateAdminContent(targetType, targetId, body);
    if ("error" in result) {
      const status =
        result.error.includes("Invalid") || result.error.includes("required") ? 400 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ message: result.message, item: result.item });
  } catch (error) {
    console.error("PATCH admin content:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update content." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { targetType: slug, targetId } = await params;
    const targetType = parseAdminContentTarget(slug);
    if (!targetType) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const message = await deleteAdminContent(targetType, targetId);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("DELETE admin content:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete content." }, { status: 500 });
  }
}
