import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { buildCoursesPayload, getAccessibleCoursesForStudent } from "@/lib/student-courses-data";

export async function GET(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const filter = request.nextUrl.searchParams.get("filter") ?? "all";
    const courses = await getAccessibleCoursesForStudent(student.id, student);
    const data = buildCoursesPayload(student, courses, filter);

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/student/courses:", error);
    return NextResponse.json({ error: "Failed to load courses." }, { status: 500 });
  }
}
