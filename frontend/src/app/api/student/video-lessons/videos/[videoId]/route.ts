import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const { videoId } = await params;

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { courseStudents: { select: { courseId: true } } },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const courseIds = student.courseStudents.map((e) => e.courseId);

    const video = await prisma.video.findFirst({
      where: { id: videoId, courseId: { in: courseIds } },
      include: {
        course: { select: { id: true, courseCode: true, courseTitle: true } },
        lecturer: { include: { user: { select: { fullName: true } } } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: video.id,
      courseId: video.courseId,
      courseCode: video.course.courseCode,
      courseTitle: video.course.courseTitle,
      title: video.title ?? "Untitled Video",
      lecturerName: video.lecturer?.user.fullName ?? "Lecturer",
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl ?? null,
      durationLabel: video.duration ?? null,
      createdAt: video.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/student/video-lessons/videos/[videoId]:", error);
    return NextResponse.json({ error: "Failed to load video." }, { status: 500 });
  }
}

