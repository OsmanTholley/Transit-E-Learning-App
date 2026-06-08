import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { mapDepartmentToRecord } from "@/lib/department-mapper";
import { mapProgramToRecord } from "@/lib/program-mapper";
import { prisma } from "@/lib/prisma";

const DEPT_INCLUDE = {
  _count: { select: { programs: true, students: true, courses: true } },
  courses: { select: { lecturerId: true } },
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        ...DEPT_INCLUDE,
        programs: {
          orderBy: { programName: "asc" },
          include: {
            department: { select: { departmentName: true } },
            _count: { select: { students: true, courses: true } },
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const courses = await prisma.course.findMany({
      where: { departmentId: id },
      orderBy: { courseCode: "asc" },
      select: { id: true, courseCode: true, courseTitle: true, level: true, semester: true },
    });

    const students = await prisma.student.findMany({
      where: { departmentId: id },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, isActive: true } },
        program: { select: { programName: true } },
      },
    });

    const lecturerIds = [
      ...new Set(department.courses.map((c) => c.lecturerId).filter((lid): lid is string => Boolean(lid))),
    ];
    const lecturers =
      lecturerIds.length > 0
        ? await prisma.lecturer.findMany({
            where: { id: { in: lecturerIds } },
            include: { user: { select: { fullName: true, email: true } } },
          })
        : [];

    return NextResponse.json({
      department: mapDepartmentToRecord(department),
      programs: department.programs.map(mapProgramToRecord),
      courses: courses.map((c) => ({
        id: c.id,
        code: c.courseCode,
        title: c.courseTitle,
        level: c.level ?? "—",
        semester: c.semester ?? "—",
      })),
      students: students.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        name: s.user.fullName,
        program: s.program?.programName ?? "—",
        status: s.user.isActive ? "Active" : "Suspended",
      })),
      lecturers: lecturers.map((l) => ({
        id: l.id,
        name: l.user.fullName,
        email: l.user.email ?? "",
      })),
    });
  } catch (error) {
    console.error("GET /api/departments/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load department." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const departmentName = body.departmentName?.trim();
    const description = body.description?.trim() ?? undefined;

    if (departmentName !== undefined && !departmentName) {
      return NextResponse.json({ error: "Department name cannot be empty." }, { status: 400 });
    }

    // Check for duplicate name
    if (departmentName) {
      const duplicate = await prisma.department.findFirst({
        where: { departmentName: { equals: departmentName, mode: "insensitive" }, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: "A department with this name already exists." }, { status: 409 });
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(departmentName ? { departmentName } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
      },
      include: DEPT_INCLUDE,
    });

    return NextResponse.json({
      message: "Department updated successfully.",
      department: mapDepartmentToRecord(updated),
    });
  } catch (error) {
    console.error("PATCH /api/departments/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update department." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { students: true, courses: true } } },
    });
    if (!dept) return NextResponse.json({ error: "Department not found." }, { status: 404 });

    if (dept._count.students > 0) {
      return NextResponse.json(
        { error: "Cannot delete — this department has enrolled students. Reassign them first." },
        { status: 409 },
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ message: `"${dept.departmentName}" has been deleted.` });
  } catch (error) {
    console.error("DELETE /api/departments/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete department." }, { status: 500 });
  }
}
