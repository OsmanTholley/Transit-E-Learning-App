import { LiveClassAudience, LiveClassStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import { handleRouteDatabaseError } from "@/lib/db-errors";
import { createLiveClassAsAdmin, expireStaleLiveClasses } from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await expireStaleLiveClasses();
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
        audience: item.audience,
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
    if (!body.title?.trim() || !body.startTime) {
      return NextResponse.json({ error: "Title and start time are required." }, { status: 400 });
    }

    const audience = (body.audience as LiveClassAudience) ?? LiveClassAudience.GENERAL;
    if (!Object.values(LiveClassAudience).includes(audience)) {
      return NextResponse.json({ error: "Invalid audience." }, { status: 400 });
    }

    const start = new Date(body.startTime);
    const end = body.endTime ? new Date(body.endTime) : undefined;
    if (end && end <= start) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const liveClass = await createLiveClassAsAdmin({
      title: body.title,
      description: body.description,
      audience,
      startTime: start,
      endTime: end,
    });

    return NextResponse.json({
      ok: true,
      class: {
        id: liveClass.id,
        title: liveClass.title,
        description: liveClass.description,
        audience: liveClass.audience,
        status: liveClass.status,
        startTime: liveClass.startTime?.toISOString() ?? null,
        endTime: liveClass.endTime?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/live-classes:", error);
    const message = error instanceof Error ? error.message : "Failed to create live class.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
