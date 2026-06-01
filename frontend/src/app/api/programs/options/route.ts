import { NextResponse } from "next/server";
import { getAdminCreatedDepartments } from "@/lib/admin-academic-options";
import { requireAdminUser, unauthorized } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const departments = await getAdminCreatedDepartments();

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("GET /api/programs/options:", error);
    return NextResponse.json({ error: "Failed to load program form options." }, { status: 500 });
  }
}
