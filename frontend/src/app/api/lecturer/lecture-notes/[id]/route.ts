import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { fetchBookCoverUrl } from "@/lib/book-cover";
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
    const body = await request.json();
    const existing = await prisma.lectureNote.findFirst({
      where: { id, lecturerId: lecturer.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const title = body.title?.trim() ?? existing.title;
    const courseId = body.courseId?.trim() ?? existing.courseId;
    const fileUrl = body.fileUrl?.trim() ?? existing.fileUrl;
    const fileType = body.fileType?.trim() ?? existing.fileType;
    const description =
      body.description !== undefined
        ? body.description?.trim() || null
        : existing.description;

    const course = await getLecturerCourseOrThrow(lecturer.id, courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const coverImageUrl =
      title !== existing.title ? await fetchBookCoverUrl(title) : existing.coverImageUrl;

    const note = await prisma.lectureNote.update({
      where: { id },
      data: {
        title,
        courseId,
        fileUrl,
        fileType,
        description,
        coverImageUrl,
      },
      include: { course: { select: { courseCode: true, courseTitle: true } } },
    });

    return NextResponse.json({
      message: "Material updated.",
      note: {
        id: note.id,
        title: note.title,
        courseId: note.courseId,
        course: `${note.course.courseCode} – ${note.course.courseTitle}`,
        fileUrl: note.fileUrl,
        fileType: note.fileType,
        description: note.description,
        coverImageUrl: note.coverImageUrl,
        createdAt: note.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("PATCH /api/lecturer/lecture-notes/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to update note." }, { status: 500 });
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
    const existing = await prisma.lectureNote.findFirst({
      where: { id, lecturerId: lecturer.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    await prisma.lectureNote.delete({ where: { id } });
    return NextResponse.json({ message: "Lecture note deleted." });
  } catch (error) {
    console.error("DELETE /api/lecturer/lecture-notes/[id]:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
  }
}
