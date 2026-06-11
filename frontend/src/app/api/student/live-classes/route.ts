import { NextResponse } from "next/server";
import { LiveClassAudience, LiveClassStatus } from "@prisma/client";
import { requireStudent } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { expireStaleLiveClasses } from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await expireStaleLiveClasses();
    const student = await requireStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const enrolledCourseIds = await prisma.courseStudent.findMany({
      where: { studentId: student.id },
      select: { courseId: true },
    });
    const courseIds = enrolledCourseIds.map((row) => row.courseId);

    const classes = await prisma.liveClass.findMany({
      where: {
        status: { in: [LiveClassStatus.SCHEDULED, LiveClassStatus.LIVE] },
        OR: [
          { courseId: { in: courseIds } },
          {
            courseId: null,
            audience: { in: [LiveClassAudience.GENERAL, LiveClassAudience.STUDENTS] },
          },
        ],
      },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        lecturer: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: [{ status: "desc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      classes: classes.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        audience: item.audience,
        status: item.status,
        roomName: item.roomName,
        startTime: item.startTime?.toISOString() ?? null,
        endTime: item.endTime?.toISOString() ?? null,
        course: item.course,
        lecturerName: item.lecturer?.user.fullName ?? null,
      })),
    });
  } catch (error) {
    console.error("GET /api/student/live-classes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load live classes." }, { status: 500 });
  }
}
