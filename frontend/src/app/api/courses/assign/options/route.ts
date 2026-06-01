import { NextRequest, NextResponse } from "next/server";
import { ACADEMIC_YEARS } from "@/lib/academic-years";
import {
  getAdminCreatedDepartments,
  getProgramsForDepartments,
} from "@/lib/admin-academic-options";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { formatAcademicYear } from "@/lib/academic-years";
import { prisma } from "@/lib/prisma";

const SEMESTERS = ["First", "Second"];

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const departmentId = request.nextUrl.searchParams.get("departmentId")?.trim();

    const departments = await getAdminCreatedDepartments();
    const departmentIds = departments.map((d) => d.id);

    const [lecturers, programs, courses] = await Promise.all([
      prisma.lecturer.findMany({
        where: { user: { isActive: true } },
        orderBy: { user: { fullName: "asc" } },
        select: {
          id: true,
          user: { select: { fullName: true, email: true } },
        },
      }),
      getProgramsForDepartments(departmentIds),
      prisma.course.findMany({
        where: departmentId ? { departmentId } : undefined,
        orderBy: { courseCode: "asc" },
        select: {
          id: true,
          courseCode: true,
          courseTitle: true,
          departmentId: true,
          programId: true,
          level: true,
          semester: true,
          lecturerId: true,
          department: { select: { departmentName: true } },
          program: { select: { programName: true } },
          lecturer: { select: { user: { select: { fullName: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      lecturers: lecturers.map((l) => ({
        id: l.id,
        name: l.user.fullName,
        email: l.user.email,
      })),
      departments,
      programs,
      years: [...ACADEMIC_YEARS],
      semesters: SEMESTERS,
      courses: courses.map((c) => ({
        id: c.id,
        code: c.courseCode,
        title: c.courseTitle,
        label: `${c.courseCode} – ${c.courseTitle}`,
        departmentId: c.departmentId,
        departmentName: c.department?.departmentName ?? "",
        programId: c.programId,
        programName: c.program?.programName ?? "",
        level: formatAcademicYear(c.level) ?? "",
        semester: c.semester ?? "",
        lecturerId: c.lecturerId,
        lecturerName: c.lecturer?.user.fullName ?? null,
      })),
    });
  } catch (error) {
    console.error("GET /api/courses/assign/options:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load assignment options." }, { status: 500 });
  }
}
