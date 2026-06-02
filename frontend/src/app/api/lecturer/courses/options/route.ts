import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { listLecturerCourseOptions } from "@/lib/lecturer/course-access";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const courses = await listLecturerCourseOptions(lecturer.id);
    return NextResponse.json({
      courses: courses.map((c) => ({
        id: c.id,
        courseCode: c.courseCode,
        courseTitle: c.courseTitle,
        label: `${c.courseCode} – ${c.courseTitle}`,
      })),
    });
  } catch (error) {
    console.error("GET /api/lecturer/courses/options:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load courses." }, { status: 500 });
  }
}
