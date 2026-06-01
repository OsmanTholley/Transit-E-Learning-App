import { NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import {
  buildCourseDetail,
  getAccessibleCoursesForStudent,
} from "@/lib/student-courses-data";
import { courseMatchesStudentProfile } from "@/lib/student-courses-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const student = await requireStudent();
    if (!student) return unauthorized();

    const { courseId } = await params;
    const courses = await getAccessibleCoursesForStudent(student.id, student);
    const index = courses.findIndex((c) => c.id === courseId);

    if (index === -1) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const course = courses[index];
    if (!courseMatchesStudentProfile(course, student)) {
      return NextResponse.json({ error: "Course not available for your program." }, { status: 403 });
    }

    return NextResponse.json(buildCourseDetail(student, course, index));
  } catch (error) {
    console.error("GET /api/student/courses/[courseId]:", error);
    return NextResponse.json({ error: "Failed to load course." }, { status: 500 });
  }
}
