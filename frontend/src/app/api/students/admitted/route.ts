import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const admitted = await prisma.admittedStudent.findMany({
      include: { department: true, program: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      admitted: admitted.map((row) => ({
        id: row.id,
        studentId: row.studentId,
        fullName: row.fullName,
        department: row.department?.departmentName ?? "—",
        program: row.program?.programName ?? "—",
        status: row.registeredAt ? "Registered" : "Pending",
        registeredAt: row.registeredAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/students/admitted:", error);
    return NextResponse.json({ error: "Failed to load admitted students." }, { status: 500 });
  }
}
