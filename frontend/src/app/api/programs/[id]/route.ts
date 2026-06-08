import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { mapProgramToRecord } from "@/lib/program-mapper";
import { prisma } from "@/lib/prisma";

const PROG_INCLUDE = {
  department: { select: { departmentName: true } },
  _count: { select: { students: true, courses: true } },
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const program = await prisma.program.findUnique({ where: { id }, include: PROG_INCLUDE });
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 });

    return NextResponse.json({ program: mapProgramToRecord(program) });
  } catch (error) {
    console.error("GET /api/programs/[id]:", error);
    return NextResponse.json({ error: "Failed to load program." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const programName = body.programName?.trim();
    const duration    = body.duration?.trim() ?? undefined;
    const departmentId = body.departmentId?.trim() ?? undefined;

    if (programName !== undefined && !programName) {
      return NextResponse.json({ error: "Program name cannot be empty." }, { status: 400 });
    }

    const program = await prisma.program.findUnique({ where: { id } });
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 });

    // Duplicate check within same department
    const targetDeptId = departmentId ?? program.departmentId;
    if (programName && targetDeptId) {
      const duplicate = await prisma.program.findFirst({
        where: {
          departmentId: targetDeptId,
          programName: { equals: programName, mode: "insensitive" },
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A program with this name already exists in that department." },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.program.update({
      where: { id },
      data: {
        ...(programName ? { programName } : {}),
        ...(duration !== undefined ? { duration: duration || null } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
      include: PROG_INCLUDE,
    });

    return NextResponse.json({ message: "Program updated successfully.", program: mapProgramToRecord(updated) });
  } catch (error) {
    console.error("PATCH /api/programs/[id]:", error);
    return NextResponse.json({ error: "Failed to update program." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const program = await prisma.program.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 });

    if (program._count.students > 0) {
      return NextResponse.json(
        { error: "Cannot delete — this program has enrolled students. Reassign them first." },
        { status: 409 },
      );
    }

    await prisma.program.delete({ where: { id } });

    return NextResponse.json({ message: `"${program.programName}" has been deleted.` });
  } catch (error) {
    console.error("DELETE /api/programs/[id]:", error);
    return NextResponse.json({ error: "Failed to delete program." }, { status: 500 });
  }
}
