import { NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const courses = await prisma.course.findMany({
      where: { lecturerId: lecturer.id },
      orderBy: { courseTitle: "asc" },
      select: { id: true, courseCode: true, courseTitle: true },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("GET /api/lecturer/live-classes/courses:", error);
    return NextResponse.json({ error: "Failed to load courses." }, { status: 500 });
  }
}
