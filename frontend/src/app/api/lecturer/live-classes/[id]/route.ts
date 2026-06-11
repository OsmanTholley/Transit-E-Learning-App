import { NextRequest, NextResponse } from "next/server";
import { requireLecturer } from "@/lib/auth";
import { cancelLiveClass, endLiveClass, extendLiveClassSession, startLiveClass, updateLiveClass } from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const lecturer = await requireLecturer();
  if (!lecturer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  try {
    if (body.action === "start") {
      const liveClass = await startLiveClass(id, lecturer.id);
      return NextResponse.json({ ok: true, status: liveClass.status });
    }

    if (body.action === "end") {
      const liveClass = await endLiveClass(id, lecturer.id);
      return NextResponse.json({ ok: true, status: liveClass.status });
    }

    if (body.action === "extend") {
      const owned = await prisma.liveClass.findFirst({ where: { id, lecturerId: lecturer.id } });
      if (!owned) {
        return NextResponse.json({ error: "Live class not found." }, { status: 404 });
      }
      const liveClass = await extendLiveClassSession(id, Number(body.minutes) || 30);
      return NextResponse.json({
        ok: true,
        endTime: liveClass.endTime?.toISOString() ?? null,
      });
    }

    if (body.action === "update") {
      const liveClass = await updateLiveClass(id, lecturer.id, {
        title: body.title,
        description: body.description,
        courseId: body.courseId,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime === null ? null : body.endTime ? new Date(body.endTime) : undefined,
      });
      return NextResponse.json({
        ok: true,
        class: {
          id: liveClass.id,
          title: liveClass.title,
          description: liveClass.description,
          status: liveClass.status,
          startTime: liveClass.startTime?.toISOString() ?? null,
          endTime: liveClass.endTime?.toISOString() ?? null,
          course: liveClass.course,
        },
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live class update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const lecturer = await requireLecturer();
  if (!lecturer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const liveClass = await cancelLiveClass(id, lecturer.id);
    return NextResponse.json({ ok: true, status: liveClass.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel class.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
