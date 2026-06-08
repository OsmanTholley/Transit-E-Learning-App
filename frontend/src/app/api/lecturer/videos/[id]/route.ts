import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { getLecturerCourseOrThrow } from "@/lib/lecturer/course-access";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const existing = await prisma.video.findFirst({
      where: { id, lecturerId: lecturer.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    const body = await request.json();
    const courseId = body.courseId?.trim() ?? existing.courseId;
    const title = body.title?.trim() ?? existing.title ?? "Video lesson";
    const videoUrl = body.videoUrl?.trim() ?? existing.videoUrl;
    const duration = body.duration?.trim() ?? existing.duration;
    const deletionNotice =
      body.deletionNotice !== undefined ? body.deletionNotice?.trim() || null : existing.deletionNotice;

    const course = await getLecturerCourseOrThrow(lecturer.id, courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const video = await prisma.video.update({
      where: { id },
      data: {
        courseId,
        title,
        videoUrl,
        duration,
        expiresAt: null,
        deletionNotice,
      },
      include: { course: { select: { courseCode: true, courseTitle: true } } },
    });

    return NextResponse.json({
      message: "Video updated.",
      video: {
        id: video.id,
        title: video.title ?? "Video lesson",
        courseId: video.courseId,
        course: `${video.course.courseCode} – ${video.course.courseTitle}`,
        videoUrl: video.videoUrl,
        duration: video.duration,
        expiresAt: video.expiresAt?.toISOString() ?? null,
        deletionNotice: video.deletionNotice,
        createdAt: video.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("PATCH /api/lecturer/videos/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update video." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const { id } = await params;
    const existing = await prisma.video.findFirst({
      where: { id, lecturerId: lecturer.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    await prisma.video.delete({ where: { id } });
    return NextResponse.json({ message: "Video deleted." });
  } catch (error) {
    console.error("DELETE /api/lecturer/videos/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete video." }, { status: 500 });
  }
}
