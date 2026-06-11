import { NextRequest, NextResponse } from "next/server";
import { requireStudent, unauthorized } from "@/lib/auth";
import { getMaterialsForStudent } from "@/lib/student-courses-data";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";

const VALID_TYPES = ["lecture-notes", "videos", "assignments", "quizzes", "discussions"] as const;

export async function GET(request: NextRequest) {
  try {
    const student = await requireStudent();
    if (!student) {
      return unauthorized();
    }

    const locked = await buildFeeLockResponse(student.id, "materials");
    if (locked) return locked;

    const type = request.nextUrl.searchParams.get("type");
    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json({ error: "Invalid material type." }, { status: 400 });
    }

    const items = await getMaterialsForStudent(student, type);
    return NextResponse.json({ items, type });
  } catch (error) {
    console.error("GET /api/student/courses/materials:", error);
    return NextResponse.json({ error: "Failed to load materials." }, { status: 500 });
  }
}
