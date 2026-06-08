import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { buildLecturerAdminDetail } from "@/lib/lecturer-portal-service";
import {
  deleteLecturerAccount,
  resetLecturerPassword,
  updateLecturerAccount,
} from "@/lib/lecturer-update";

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const result = await updateLecturerAccount(id, { ...body, actorId: admin.id });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Lecturer updated successfully.",
      lecturer: result.lecturer,
    });
  } catch (error) {
    console.error("PATCH /api/lecturers/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update lecturer." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const result = await deleteLecturerAccount(id, admin.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("DELETE /api/lecturers/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete lecturer." }, { status: 500 });
  }
}
