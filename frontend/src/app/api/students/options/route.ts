import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { getNextStudentId } from "@/lib/student-id";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const [departments, programs, existingStudents, admittedStudents] = await Promise.all([
      prisma.department.findMany({
        orderBy: { departmentName: "asc" },
        select: { id: true, departmentName: true },
      }),
      prisma.program.findMany({
        orderBy: { programName: "asc" },
        select: { id: true, programName: true, departmentId: true },
      }),
      prisma.student.findMany({ select: { studentId: true } }),
      prisma.admittedStudent.findMany({ select: { studentId: true } }),
    ]);

    const allIds = [
      ...existingStudents.map((s) => s.studentId),
      ...admittedStudents.map((s) => s.studentId),
    ];
    const nextStudentId = getNextStudentId(allIds);

    return NextResponse.json({
      nextStudentId,
      studentIdFormat: "TCSL/0001",
      departments: departments.map((d: { id: string; departmentName: string }) => ({
        id: d.id,
        name: d.departmentName,
      })),
      programs: programs.map((p: { id: string; programName: string; departmentId: string | null }) => ({
        id: p.id,
        name: p.programName,
        departmentId: p.departmentId,
      })),
      years: [...ACADEMIC_YEARS],
      genders: ["Male", "Female", "Other"],
    });
  } catch (error) {
    console.error("GET /api/students/options:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load form options." }, { status: 500 });
  }
}
