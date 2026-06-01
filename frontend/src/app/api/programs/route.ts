import { NextRequest, NextResponse } from "next/server";
import { getAdminCreatedDepartments } from "@/lib/admin-academic-options";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { mapProgramToRecord } from "@/lib/program-mapper";
import { isSeedDepartmentName } from "@/lib/seed-departments";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const rows = await prisma.program.findMany({
      include: {
        department: { select: { departmentName: true } },
        _count: { select: { students: true, courses: true } },
      },
      orderBy: { programName: "asc" },
    });

    const programs = rows
      .filter((p) => !p.department || !isSeedDepartmentName(p.department.departmentName))
      .map(mapProgramToRecord);

    return NextResponse.json({ programs });
  } catch (error) {
    console.error("GET /api/programs:", error);
    return NextResponse.json({ error: "Failed to load programs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const { programName, departmentId, duration } = body;

    if (!programName?.trim()) {
      return NextResponse.json({ error: "Program name is required." }, { status: 400 });
    }
    if (!departmentId?.trim()) {
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId.trim() },
      select: { id: true, departmentName: true },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    if (isSeedDepartmentName(department.departmentName)) {
      return NextResponse.json(
        { error: "Programs can only be created under admin-created departments." },
        { status: 400 },
      );
    }

    const adminDepartments = await getAdminCreatedDepartments();
    if (!adminDepartments.some((d) => d.id === department.id)) {
      return NextResponse.json({ error: "Invalid department for program creation." }, { status: 400 });
    }

    const existing = await prisma.program.findFirst({
      where: {
        departmentId: department.id,
        programName: { equals: programName.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A program with this name already exists in the selected department." },
        { status: 409 },
      );
    }

    const program = await prisma.program.create({
      data: {
        programName: programName.trim(),
        departmentId: department.id,
        duration: duration?.trim() || null,
      },
      include: {
        department: { select: { departmentName: true } },
        _count: { select: { students: true, courses: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Program created successfully.",
        program: mapProgramToRecord(program),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/programs:", error);
    return NextResponse.json({ error: "Failed to create program." }, { status: 500 });
  }
}
