import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, courseStudents: { select: { courseId: true } } },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const courseIds = student.courseStudents.map((e) => e.courseId);
    if (courseIds.length === 0) {
      return NextResponse.json([]);
    }

    const classes = await prisma.liveClass.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        lecturer: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { startTime: "asc" },
      take: 50,
    });

    return NextResponse.json(
      classes.map((c) => ({
        id: c.id,
        courseCode: c.course?.courseCode ?? "COURSE",
        courseTitle: c.course?.courseTitle ?? "Course",
        lecturerName: c.lecturer?.user.fullName ?? "Lecturer",
        meetingLink: c.meetingLink ?? null,
        startTime: c.startTime ? c.startTime.toISOString() : null,
        endTime: c.endTime ? c.endTime.toISOString() : null,
      }))
    );
  } catch (error) {
    console.error("GET /api/student/video-lessons/live-classes:", error);
    return NextResponse.json({ error: "Failed to load live classes." }, { status: 500 });
  }
}

