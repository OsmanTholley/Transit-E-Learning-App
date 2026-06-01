import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { assignProgramToStudents } from "@/lib/student-program-assignment";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const { studentIds, departmentId, programId, level, semester, admissionYear } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Select at least one student." }, { status: 400 });
    }

    const result = await assignProgramToStudents(studentIds, {
      departmentId,
      programId,
      level,
      semester,
      admissionYear,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: `Academic program assigned to ${result.count} student${result.count === 1 ? "" : "s"}.`,
      students: result.students,
      count: result.count,
    });
  } catch (error) {
    console.error("POST /api/students/assign-program:", error);
    return NextResponse.json({ error: "Failed to assign academic program." }, { status: 500 });
  }
}
