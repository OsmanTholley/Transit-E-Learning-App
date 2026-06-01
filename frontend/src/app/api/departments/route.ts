import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { mapDepartmentToRecord } from "@/lib/department-mapper";
import { isSeedDepartmentName } from "@/lib/seed-departments";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const rows = await prisma.department.findMany({
      include: {
        _count: { select: { programs: true, students: true, courses: true } },
        courses: { select: { lecturerId: true } },
      },
      orderBy: { departmentName: "asc" },
    });

    const departments = rows
      .filter((d) => !isSeedDepartmentName(d.departmentName))
      .map(mapDepartmentToRecord);

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("GET /api/departments:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load departments." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const departmentName = body.departmentName?.trim();
    const description = body.description?.trim() || null;

    if (!departmentName) {
      return NextResponse.json({ error: "Department name is required." }, { status: 400 });
    }

    if (isSeedDepartmentName(departmentName)) {
      return NextResponse.json({ error: "This department name is reserved." }, { status: 400 });
    }

    const existing = await prisma.department.findFirst({
      where: { departmentName: { equals: departmentName, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json({ error: "A department with this name already exists." }, { status: 409 });
    }

    const created = await prisma.department.create({
      data: { departmentName, description },
      include: {
        _count: { select: { programs: true, students: true, courses: true } },
        courses: { select: { lecturerId: true } },
      },
    });

    return NextResponse.json({
      message: `${departmentName} has been created.`,
      department: mapDepartmentToRecord(created),
    });
  } catch (error) {
    console.error("POST /api/departments:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to create department." }, { status: 500 });
  }
}
