import { LiveClassAudience, LiveClassStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireLecturer } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { createLiveClass, expireStaleLiveClasses } from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await expireStaleLiveClasses();
    const lecturer = await requireLecturer();
    if (!lecturer) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const classes = await prisma.liveClass.findMany({
      where: {
        status: { in: [LiveClassStatus.SCHEDULED, LiveClassStatus.LIVE] },
        OR: [
          { lecturerId: lecturer.id },
          {
            courseId: null,
            lecturerId: null,
            audience: { in: [LiveClassAudience.GENERAL, LiveClassAudience.LECTURERS] },
          },
        ],
      },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
      },
      orderBy: [{ status: "desc" }, { startTime: "asc" }],
      take: 50,
    });

    return NextResponse.json({
      classes: classes.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        audience: item.audience,
        status: item.status,
        roomName: item.roomName,
        courseId: item.courseId,
        startTime: item.startTime?.toISOString() ?? null,
        endTime: item.endTime?.toISOString() ?? null,
        course: item.course,
      })),
    });
  } catch (error) {
    console.error("GET /api/lecturer/live-classes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load live classes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();
    if (!lecturer) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    if (!body.courseId || !body.title?.trim() || !body.startTime) {
      return NextResponse.json({ error: "Course, title, and start time are required." }, { status: 400 });
    }

    const start = new Date(body.startTime);
    const end = body.endTime ? new Date(body.endTime) : undefined;
    if (end && end <= start) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const liveClass = await createLiveClass({
      lecturerId: lecturer.id,
      courseId: body.courseId,
      title: body.title,
      description: body.description,
      startTime: start,
      endTime: end,
      createdById: lecturer.userId,
    });

    return NextResponse.json({
      ok: true,
      class: {
        id: liveClass.id,
        title: liveClass.title,
        roomName: liveClass.roomName,
        status: liveClass.status,
        startTime: liveClass.startTime?.toISOString() ?? null,
        course: liveClass.course,
      },
    });
  } catch (error) {
    console.error("POST /api/lecturer/live-classes:", error);
    const message = error instanceof Error ? error.message : "Failed to create live class.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
