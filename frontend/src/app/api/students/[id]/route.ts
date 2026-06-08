import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { assignProgramToStudents } from "@/lib/student-program-assignment";
import { updateStudentAccount } from "@/lib/student-update";
import { deleteStudentAccount } from "@/lib/student-delete";
import { prisma } from "@/lib/prisma";
import { mapStudentToRecord } from "@/lib/student-mapper";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { studentId: id }] },
      include: {
        user: true,
        department: true,
        program: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    return NextResponse.json({ student: mapStudentToRecord(student) });
  } catch (error) {
    console.error("GET /api/students/[id]:", error);
    return NextResponse.json({ error: "Failed to load student." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const isProgramOnly =
      body.departmentId &&
      body.programId &&
      body.level &&
      body.fullName === undefined &&
      body.email === undefined &&
      body.phone === undefined &&
      body.isActive === undefined;

    if (isProgramOnly) {
      const student = await prisma.student.findFirst({
        where: { OR: [{ id }, { studentId: id }] },
        select: { id: true },
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }

      const result = await assignProgramToStudents([student.id], {
        departmentId: body.departmentId,
        programId: body.programId,
        level: body.level,
        gender: body.gender,
        admissionYear: body.admissionYear,
      });

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        message: "Academic program assigned successfully.",
        student: result.students[0],
      });
    }

    const result = await updateStudentAccount(id, { ...body, actorId: admin.id });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Student updated successfully.",
      student: result.student,
    });
  } catch (error) {
    console.error("PATCH /api/students/[id]:", error);
    return NextResponse.json({ error: "Failed to update student." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const result = await deleteStudentAccount(id, admin.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("DELETE /api/students/[id]:", error);
    return NextResponse.json({ error: "Failed to delete student." }, { status: 500 });
  }
}
