import { NextResponse } from "next/server";
import {
  getActiveLecturerOptions,
  getAdminCreatedDepartments,
  getProgramsForDepartments,
} from "@/lib/admin-academic-options";
import { requireAdminUser, unauthorized } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const departments = await getAdminCreatedDepartments();
    const departmentIds = departments.map((d) => d.id);
    const [programs, lecturers] = await Promise.all([
      getProgramsForDepartments(departmentIds),
      getActiveLecturerOptions(),
    ]);

    return NextResponse.json({ departments, programs, lecturers });
  } catch (error) {
    console.error("GET /api/courses/options:", error);
    return NextResponse.json({ error: "Failed to load course form options." }, { status: 500 });
  }
}
