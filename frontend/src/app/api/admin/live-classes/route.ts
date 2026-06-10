import { LiveClassStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { createLiveClassAsAdmin } from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const classes = await prisma.liveClass.findMany({
      where: {
        status: { in: [LiveClassStatus.SCHEDULED, LiveClassStatus.LIVE] },
      },
      include: {
        course: { select: { courseCode: true, courseTitle: true } },
        lecturer: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: [{ status: "desc" }, { startTime: "asc" }],
      take: 100,
    });

    return NextResponse.json({
      classes: classes.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        roomName: item.roomName,
        courseId: item.courseId,
        lecturerId: item.lecturerId,
        startTime: item.startTime?.toISOString() ?? null,
        endTime: item.endTime?.toISOString() ?? null,
        course: item.course,
        lecturerName: item.lecturer?.user.fullName ?? null,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/live-classes:", error);
    const dbResponse = handleRouteDatabaseError(error);
    if (dbResponse) return dbResponse;
    return NextResponse.json({ error: "Failed to load live classes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) return unauthorized();

    const body = await request.json();
    if (!body.courseId || !body.lecturerId || !body.title?.trim() || !body.startTime) {
      return NextResponse.json(
        { error: "Course, lecturer, title, and start time are required." },
        { status: 400 },
      );
    }

    const start = new Date(body.startTime);
    const end = body.endTime ? new Date(body.endTime) : undefined;
    if (end && end <= start) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const liveClass = await createLiveClassAsAdmin({
      courseId: body.courseId,
      lecturerId: body.lecturerId,
      title: body.title,
      description: body.description,
      startTime: start,
      endTime: end,
    });

    return NextResponse.json({
      ok: true,
      class: {
        id: liveClass.id,
        title: liveClass.title,
        status: liveClass.status,
        startTime: liveClass.startTime?.toISOString() ?? null,
        course: liveClass.course,
        lecturerName: liveClass.lecturer?.user.fullName ?? null,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/live-classes:", error);
    const message = error instanceof Error ? error.message : "Failed to create live class.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
