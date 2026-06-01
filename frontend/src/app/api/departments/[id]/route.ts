import { NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { mapDepartmentToRecord } from "@/lib/department-mapper";
import { mapProgramToRecord } from "@/lib/program-mapper";
import { isSeedDepartmentName } from "@/lib/seed-departments";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { programs: true, students: true, courses: true } },
        courses: { select: { lecturerId: true } },
        programs: {
          orderBy: { programName: "asc" },
          include: {
            department: { select: { departmentName: true } },
            _count: { select: { students: true, courses: true } },
          },
        },
      },
    });

    if (!department || isSeedDepartmentName(department.departmentName)) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const courses = await prisma.course.findMany({
      where: { departmentId: id },
      orderBy: { courseCode: "asc" },
      select: { courseCode: true, courseTitle: true, level: true, semester: true },
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
