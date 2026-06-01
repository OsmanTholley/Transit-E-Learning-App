import { NextResponse } from "next/server";
import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const [departments, students] = await Promise.all([
      prisma.department.findMany({
        orderBy: { departmentName: "asc" },
        select: { id: true, departmentName: true },
      }),
      prisma.student.findMany({
        where: { user: { isActive: true } },
        orderBy: { studentId: "asc" },
        select: {
          id: true,
          studentId: true,
          user: { select: { fullName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      departments: departments.map((d) => ({ id: d.id, name: d.departmentName })),
      students: students.map((s) => ({
        id: s.id,
        label: `${s.studentId} — ${s.user.fullName}`,
      })),
      years: [...ACADEMIC_YEARS],
    });
  } catch (error) {
    console.error("GET /api/students/messages/targets:", error);
    return NextResponse.json({ error: "Failed to load audience options." }, { status: 500 });
  }
}
