import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { buildLecturerCoursesData } from "@/lib/lecturer-portal-service";
import { prisma } from "@/lib/prisma";
import { isValidSyllabusRef } from "@/lib/syllabus-url";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const data = await buildLecturerCoursesData(lecturer.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/lecturer/courses:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load courses." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const body = (await request.json()) as {
      courseId?: string;
      description?: string;
      learningOutcomes?: string[];
      syllabusUrl?: string;
      syllabusText?: string;
    };

    if (!body.courseId?.trim()) {
      return NextResponse.json({ error: "Course id is required." }, { status: 400 });
    }

    const course = await prisma.course.findFirst({
      where: { id: body.courseId, lecturerId: lecturer.id },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const sanitizedOutcomes = (body.learningOutcomes ?? [])
      .map((item) => item.trim())
      .filter(Boolean);

    const syllabusUrl = body.syllabusUrl?.trim() ?? "";
    if (!isValidSyllabusRef(syllabusUrl)) {
      return NextResponse.json(
        { error: "Syllabus file must be a valid URL or an uploaded /uploads/ path." },
        { status: 400 }
      );
    }

    const syllabusText = body.syllabusText?.trim() || null;

    await prisma.course.update({
      where: { id: course.id },
      data: {
        description: body.description?.trim() || null,
        learningOutcomes: sanitizedOutcomes.length > 0 ? sanitizedOutcomes.join("\n") : null,
        syllabusUrl: syllabusUrl || null,
        syllabusText,
      },
    });

    const data = await buildLecturerCoursesData(lecturer.id);
    return NextResponse.json({ message: "Course updated successfully.", ...data });
  } catch (error) {
    console.error("PATCH /api/lecturer/courses:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
  }
}
