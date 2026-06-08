import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { buildStudentOverview } from "@/lib/student-overview";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { studentId: id }] },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const overview = await buildStudentOverview(student.id);
    return NextResponse.json({ overview });
  } catch (error) {
    console.error("GET /api/students/[id]/overview:", error);
    return NextResponse.json({ error: "Failed to load student overview." }, { status: 500 });
  }
}
