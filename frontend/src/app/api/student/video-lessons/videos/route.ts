import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";

export async function GET() {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        courseStudents: { select: { courseId: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const locked = await buildFeeLockResponse(student.id, "videos");
    if (locked) return locked;

    const courseIds = student.courseStudents.map((e) => e.courseId);
    if (courseIds.length === 0) {
      return NextResponse.json([]);
    }

    const videos = await prisma.video.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: { select: { id: true, courseCode: true, courseTitle: true } },
        lecturer: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      videos.map((v) => ({
        id: v.id,
        courseId: v.courseId,
        courseCode: v.course.courseCode,
        courseTitle: v.course.courseTitle,
        title: v.title ?? "Untitled Video",
        lecturerName: v.lecturer?.user.fullName ?? "Lecturer",
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl ?? null,
        durationLabel: v.duration ?? null,
        createdAt: v.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/student/video-lessons/videos:", error);
    return NextResponse.json({ error: "Failed to load videos." }, { status: 500 });
  }
}

