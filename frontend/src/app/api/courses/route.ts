import { NextRequest, NextResponse } from "next/server";
import { getAdminCreatedDepartments } from "@/lib/admin-academic-options";
import { normalizeAcademicYear } from "@/lib/academic-years";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { mapCourseToRecord } from "@/lib/course-mapper";
import { isSeedDepartmentName } from "@/lib/seed-departments";
import { prisma } from "@/lib/prisma";

function departmentCodeSlug(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter(Boolean);
  if (parts.length === 0) return "DEPT";
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

function buildCourseCode(baseCode: string, departmentName: string, multipleDepartments: boolean) {
  const normalized = baseCode.trim().toUpperCase();
  if (!multipleDepartments) return normalized;
  return `${normalized}-${departmentCodeSlug(departmentName)}`;
}

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const courses = await prisma.course.findMany({
      include: {
        department: { select: { departmentName: true } },
        program: { select: { programName: true } },
        lecturer: { select: { user: { select: { fullName: true } } } },
        _count: { select: { courseStudents: true } },
      },
      orderBy: { courseCode: "asc" },
    });

    return NextResponse.json({
      courses: courses.map(mapCourseToRecord),
    });
  } catch (error) {
    console.error("GET /api/courses:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load courses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    const courseCode = body.courseCode?.trim();
    const courseTitle = body.courseTitle?.trim();
    const programId = body.programId?.trim();
    const lecturerId = body.lecturerId?.trim() || null;
    const level = normalizeAcademicYear(body.level);
    const semester = body.semester?.trim() || null;
    const category = body.category?.trim() || null;

    const departmentIds: string[] = Array.isArray(body.departmentIds)
      ? body.departmentIds.map((id: string) => String(id).trim()).filter(Boolean)
      : body.departmentId?.trim()
        ? [body.departmentId.trim()]
        : [];

    if (!courseCode || !courseTitle) {
      return NextResponse.json({ error: "Course code and title are required." }, { status: 400 });
    }
    if (departmentIds.length === 0) {
      return NextResponse.json({ error: "Select at least one department." }, { status: 400 });
    }
    if (!programId) {
      return NextResponse.json({ error: "Program is required." }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: "Year is required." }, { status: 400 });
    }
    if (!semester) {
      return NextResponse.json({ error: "Semester is required." }, { status: 400 });
    }

    const adminDepartments = await getAdminCreatedDepartments();
    const allowedIds = new Set(adminDepartments.map((d) => d.id));
    const uniqueDepartmentIds = [...new Set(departmentIds)];

    for (const id of uniqueDepartmentIds) {
      if (!allowedIds.has(id)) {
        return NextResponse.json({ error: "One or more departments are invalid." }, { status: 400 });
      }
    }

    const templateProgram = await prisma.program.findUnique({
      where: { id: programId },
      select: { id: true, programName: true, departmentId: true },
    });
    if (!templateProgram) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 });
    }

    if (lecturerId) {
      const lecturer = await prisma.lecturer.findFirst({
        where: { id: lecturerId, user: { isActive: true } },
      });
      if (!lecturer) {
        return NextResponse.json({ error: "Lecturer not found or inactive." }, { status: 400 });
      }
    }

    const departments = await prisma.department.findMany({
      where: { id: { in: uniqueDepartmentIds } },
      select: { id: true, departmentName: true },
    });

    if (departments.length !== uniqueDepartmentIds.length) {
      return NextResponse.json({ error: "One or more departments were not found." }, { status: 404 });
    }

    const multipleDepartments = departments.length > 1;
    const descriptionParts = [category ? `Category: ${category}` : null].filter(Boolean);
    const description = descriptionParts.length ? descriptionParts.join("\n") : null;

    const created: { code: string; department: string }[] = [];

    for (const department of departments) {
      if (isSeedDepartmentName(department.departmentName)) {
        return NextResponse.json(
          { error: `Cannot create courses under seed department “${department.departmentName}”.` },
          { status: 400 }
        );
      }

      let programIdForDept = templateProgram.id;
      if (templateProgram.departmentId !== department.id) {
        const matchingProgram = await prisma.program.findFirst({
          where: {
            departmentId: department.id,
            programName: { equals: templateProgram.programName, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (!matchingProgram) {
          return NextResponse.json(
            {
              error: `Program “${templateProgram.programName}” is not available in ${department.departmentName}. Add it there first or choose another program.`,
            },
            { status: 400 }
          );
        }
        programIdForDept = matchingProgram.id;
      }

      const code = buildCourseCode(courseCode, department.departmentName, multipleDepartments);

      const existing = await prisma.course.findUnique({ where: { courseCode: code } });
      if (existing) {
        return NextResponse.json(
          { error: `Course code “${code}” already exists.` },
          { status: 409 }
        );
      }

      await prisma.course.create({
        data: {
          courseCode: code,
          courseTitle,
          departmentId: department.id,
          programId: programIdForDept,
          lecturerId,
          level,
          semester,
          description,
        },
      });

      created.push({ code, department: department.departmentName });
    }

    const message =
      created.length === 1
        ? `Course ${created[0].code} created for ${created[0].department}.`
        : `Created ${created.length} courses: ${created.map((c) => `${c.code} (${c.department})`).join(", ")}.`;

    return NextResponse.json({ message, created });
  } catch (error) {
    console.error("POST /api/courses:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
  }
}
