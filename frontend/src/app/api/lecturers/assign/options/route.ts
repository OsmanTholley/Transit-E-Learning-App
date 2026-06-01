import { NextRequest, NextResponse } from "next/server";
import { getAdminCreatedDepartments } from "@/lib/admin-academic-options";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const departmentId = request.nextUrl.searchParams.get("departmentId")?.trim();

    const [lecturers, departments, courses] = await Promise.all([
      prisma.lecturer.findMany({
        where: { user: { isActive: true } },
        orderBy: { user: { fullName: "asc" } },
        select: {
          id: true,
          user: { select: { fullName: true, email: true } },
        },
      }),
      getAdminCreatedDepartments(),
      prisma.course.findMany({
        where: departmentId ? { departmentId } : undefined,
        orderBy: { courseCode: "asc" },
        select: {
          id: true,
          courseCode: true,
          courseTitle: true,
          departmentId: true,
          level: true,
          semester: true,
          lecturerId: true,
          department: { select: { departmentName: true } },
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
      courses: courses.map((c) => ({
        id: c.id,
        code: c.courseCode,
        title: c.courseTitle,
        departmentId: c.departmentId,
        departmentName: c.department?.departmentName ?? "",
        level: c.level,
        semester: c.semester,
        lecturerId: c.lecturerId,
        lecturerName: c.lecturer?.user.fullName ?? null,
        label: `${c.courseCode} – ${c.courseTitle}`,
      })),
    });
  } catch (error) {
    console.error("GET /api/lecturers/assign/options:", error);
    return NextResponse.json({ error: "Failed to load assignment options." }, { status: 500 });
  }
}
