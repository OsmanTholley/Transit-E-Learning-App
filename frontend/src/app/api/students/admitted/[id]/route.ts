import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const admitted = await prisma.admittedStudent.findUnique({ where: { id } });
    if (!admitted) {
      return NextResponse.json({ error: "Admitted student not found." }, { status: 404 });
    }

    if (admitted.registeredAt) {
      return NextResponse.json(
        { error: "Cannot edit a student who has already registered." },
        { status: 400 },
      );
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : admitted.fullName;
    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    let departmentId: string | null = admitted.departmentId;
    if (body.departmentId !== undefined) {
      departmentId = body.departmentId ? String(body.departmentId) : null;
    }

    let programId: string | null = admitted.programId;
    if (body.programId !== undefined) {
      programId = body.programId ? String(body.programId) : null;
    }

    const updated = await prisma.admittedStudent.update({
      where: { id },
      data: {
        fullName,
        departmentId,
        programId,
        ...(typeof body.level === "string" ? { level: body.level.trim() || null } : {}),
        ...(typeof body.admissionYear === "string"
          ? { admissionYear: body.admissionYear.trim() || null }
          : {}),
      },
      include: { department: true, program: true },
    });

    return NextResponse.json({
      message: "Admitted student updated.",
      admitted: {
        id: updated.id,
        studentId: updated.studentId,
        fullName: updated.fullName,
        department: updated.department?.departmentName ?? "—",
        program: updated.program?.programName ?? "—",
        status: updated.registeredAt ? "Registered" : "Pending",
      },
    });
  } catch (error) {
    console.error("PATCH /api/students/admitted/[id]:", error);
    return NextResponse.json({ error: "Failed to update admitted student." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const admitted = await prisma.admittedStudent.findUnique({ where: { id } });
    if (!admitted) {
      return NextResponse.json({ error: "Admitted student not found." }, { status: 404 });
    }

    if (admitted.registeredAt) {
      return NextResponse.json(
        { error: "Cannot remove a student who has already registered." },
        { status: 400 },
      );
    }

    await prisma.admittedStudent.delete({ where: { id } });

    return NextResponse.json({ message: "Removed from admitted registry." });
  } catch (error) {
    console.error("DELETE /api/students/admitted/[id]:", error);
    return NextResponse.json({ error: "Failed to remove admitted student." }, { status: 500 });
  }
}
