import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { getLecturerCourseOrThrow } from "@/lib/lecturer/course-access";
import { notifyContentPublished } from "@/lib/content-notify";
import { prisma } from "@/lib/prisma";
import { clearLegacyVideoExpiry } from "@/lib/video-expiry";

function mapVideo(v: {
  id: string;
  title: string | null;
  courseId: string;
  videoUrl: string;
  duration: string | null;
  expiresAt: Date | null;
  deletionNotice: string | null;
  createdAt: Date;
  course: { courseCode: string; courseTitle: string };
}) {
  return {
    id: v.id,
    title: v.title ?? "Untitled video",
    courseId: v.courseId,
    course: `${v.course.courseCode} – ${v.course.courseTitle}`,
    videoUrl: v.videoUrl,
    duration: v.duration,
    expiresAt: v.expiresAt?.toISOString() ?? null,
    deletionNotice: v.deletionNotice,
    createdAt: v.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    await clearLegacyVideoExpiry();

    const videos = await prisma.video.findMany({
      where: { lecturerId: lecturer.id },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { courseCode: true, courseTitle: true } } },
    });

    return NextResponse.json({
      videos: videos.map(mapVideo),
    });
  } catch (error) {
    console.error("GET /api/lecturer/videos:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load videos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const body = await request.json();
    const courseId = body.courseId?.trim();
    const title = body.title?.trim() || "Video lesson";
    const videoUrl = body.videoUrl?.trim();
    const duration = body.duration?.trim() || null;
    const thumbnailUrl = body.thumbnailUrl?.trim() || null;
    const customNotice = body.deletionNotice?.trim() || null;

    if (!courseId || !videoUrl) {
      return NextResponse.json(
        { error: "Course and video URL or file are required." },
        { status: 400 }
      );
    }

    const course = await getLecturerCourseOrThrow(lecturer.id, courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const expiresAt = null;
    const deletionNotice = customNotice;

    const video = await prisma.video.create({
      data: {
        courseId,
        lecturerId: lecturer.id,
        title,
        videoUrl,
        duration,
        thumbnailUrl,
        expiresAt,
        deletionNotice,
      },
      include: { course: { select: { courseCode: true, courseTitle: true } } },
    });

    const courseLabel = `${video.course.courseCode} – ${video.course.courseTitle}`;
    const notified = await notifyContentPublished(
      courseId,
      courseLabel,
      title,
      "video",
      deletionNotice
    );

    return NextResponse.json(
      {
        message: `Video published. ${notified.students} student(s) and ${notified.admins} admin(s) notified.`,
        video: mapVideo(video),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/lecturer/videos:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to publish video." }, { status: 500 });
  }
}
