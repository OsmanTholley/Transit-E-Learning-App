import { formatAcademicYear } from "@/lib/academic-years";
import { NextRequest, NextResponse } from "next/server";
import { findAdmittedStudentForRegistration } from "@/lib/admitted-student";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const studentId = body.studentId ?? "";

    const result = await findAdmittedStudentForRegistration(studentId);

    if ("error" in result) {
      const message = result.error ?? "Could not verify student ID.";
      const status = message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: message }, { status });
    }

    const { admitted, normalizedStudentId } = result;

    return NextResponse.json({
      valid: true,
      studentId: normalizedStudentId,
      fullName: admitted.fullName,
      department: admitted.department?.departmentName ?? "",
      program: admitted.program?.programName ?? "",
      year: formatAcademicYear(admitted.level) === "—" ? "" : formatAcademicYear(admitted.level),
      semester: admitted.semester ?? "",
      admissionYear: admitted.admissionYear ?? "",
    });
  } catch (error) {
    console.error("POST /api/auth/register/verify-id:", error);
    return NextResponse.json({ error: "Could not verify student ID." }, { status: 500 });
  }
}
