import { NextResponse } from "next/server";
import { unauthorized, validateStudentSession } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { listStudentLiveClasses } from "@/lib/live-classroom/service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await validateStudentSession();
    if (!user) return unauthorized();

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student profile not found." }, { status: 404 });
    }

    const sessions = await listStudentLiveClasses(student.id);

    const recordings = await prisma.liveClassRecording.findMany({
      where: { liveClass: { course: { courseStudents: { some: { studentId: student.id } } } } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        liveClass: {
          select: {
            title: true,
            course: { select: { courseCode: true, courseTitle: true } },
          },
        },
      },
    });

    return NextResponse.json({
      sessions,
      recordings: recordings.map((r) => ({
        id: r.id,
        title: r.title,
        recordingUrl: r.recordingUrl,
        courseCode: r.liveClass.course?.courseCode ?? "—",
        courseTitle: r.liveClass.course?.courseTitle ?? "—",
        classTitle: r.liveClass.title ?? "Live Class",
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/student/live-classes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load live classes." }, { status: 500 });
  }
}
