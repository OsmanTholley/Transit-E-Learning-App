import { normalizeAcademicYear } from "@/lib/academic-years";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { resolveDepartmentProgramIds } from "@/lib/admitted-student";
import { prisma } from "@/lib/prisma";
import { isValidStudentId, normalizeStudentId, STUDENT_ID_FORMAT_HINT } from "@/lib/student-id";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const { fullName, studentId, departmentName, programName, year, gender, admissionYear } = body;

    if (!fullName?.trim() || !studentId?.trim()) {
      return NextResponse.json({ error: "Full name and student ID are required." }, { status: 400 });
    }

    const normalizedStudentId = normalizeStudentId(studentId);
    if (!isValidStudentId(normalizedStudentId)) {
      return NextResponse.json(
        { error: `Student ID must use the format ${STUDENT_ID_FORMAT_HINT}.` },
        { status: 400 }
      );
    }

    const existingStudent = await prisma.student.findUnique({
      where: { studentId: normalizedStudentId },
    });
    if (existingStudent) {
      return NextResponse.json({ error: "This student ID already has an account." }, { status: 409 });
    }

    const existingAdmitted = await prisma.admittedStudent.findUnique({
      where: { studentId: normalizedStudentId },
    });
    if (existingAdmitted) {
      return NextResponse.json(
        { error: "This student ID is already in the admitted students list." },
        { status: 409 }
      );
    }

    const deptProgram = await resolveDepartmentProgramIds(departmentName, programName);
    if ("error" in deptProgram) {
      return NextResponse.json({ error: deptProgram.error }, { status: 400 });
    }

    const admitted = await prisma.admittedStudent.create({
      data: {
        studentId: normalizedStudentId,
        fullName: fullName.trim(),
        departmentId: deptProgram.departmentId,
        programId: deptProgram.programId,
        level: normalizeAcademicYear(year),
        gender: gender?.trim() || null,
        admissionYear: admissionYear?.trim() || null,
      },
      include: { department: true, program: true },
    });

    await logActivity({
      actorId: admin.id,
      action: "student.admitted",
      entityType: "admitted_student",
      entityId: admitted.id,
      summary: `Admitted ${admitted.fullName} (${admitted.studentId})`,
    });

    return NextResponse.json(
      {
        message: "Student admitted successfully. They can now register using their student ID.",
        admitted: {
          studentId: admitted.studentId,
          fullName: admitted.fullName,
          department: admitted.department?.departmentName,
          program: admitted.program?.programName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/students/admit:", error);
    return NextResponse.json({ error: "Failed to admit student." }, { status: 500 });
  }
}
