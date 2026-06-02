import { NextRequest, NextResponse } from "next/server";
import { requireLecturer, unauthorized } from "@/lib/auth";
import { fetchBookCoverUrl } from "@/lib/book-cover";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { notifyContentPublished } from "@/lib/content-notify";
import { getLecturerCourseOrThrow } from "@/lib/lecturer/course-access";
import { prisma } from "@/lib/prisma";

function mapNote(n: {
  id: string;
  title: string;
  courseId: string;
  fileUrl: string;
  fileType: string | null;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
  course: { courseCode: string; courseTitle: string };
}) {
  return {
    id: n.id,
    title: n.title,
    courseId: n.courseId,
    course: `${n.course.courseCode} – ${n.course.courseTitle}`,
    fileUrl: n.fileUrl,
    fileType: n.fileType,
    description: n.description,
    coverImageUrl: n.coverImageUrl,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const notes = await prisma.lectureNote.findMany({
      where: { lecturerId: lecturer.id },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { courseCode: true, courseTitle: true } } },
    });

    return NextResponse.json({
      notes: notes.map(mapNote),
    });
  } catch (error) {
    console.error("GET /api/lecturer/lecture-notes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load lecture notes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) return unauthorized();

    const body = await request.json();
    const courseId = body.courseId?.trim();
    const title = body.title?.trim();
    const fileUrl = body.fileUrl?.trim();
    const fileType = body.fileType?.trim() || null;
    const description = body.description?.trim() || null;

    if (!courseId || !title || !fileUrl) {
      return NextResponse.json(
        { error: "Course, title, and file are required." },
        { status: 400 }
      );
    }

    const course = await getLecturerCourseOrThrow(lecturer.id, courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const coverImageUrl = await fetchBookCoverUrl(title);

    const note = await prisma.lectureNote.create({
      data: {
        courseId,
        lecturerId: lecturer.id,
        title,
        fileUrl,
        fileType,
        description,
        coverImageUrl,
      },
      include: { course: { select: { courseCode: true, courseTitle: true } } },
    });

    const courseLabel = `${note.course.courseCode} – ${note.course.courseTitle}`;
    const notified = await notifyContentPublished(
      courseId,
      courseLabel,
      title,
      "material"
    );

    return NextResponse.json(
      {
        message: `Material published. ${notified.students} student(s) and ${notified.admins} admin(s) notified.`,
        note: mapNote(note),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/lecturer/lecture-notes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to upload lecture note." }, { status: 500 });
  }
}
