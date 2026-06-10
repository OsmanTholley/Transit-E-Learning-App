import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, unauthorized } from "@/lib/auth";
import {
  cancelLiveClassAsAdmin,
  endLiveClassAsAdmin,
  startLiveClassAsAdmin,
  updateLiveClassAsAdmin,
} from "@/lib/live-class-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await requireAdminUser();
  if (!admin) return unauthorized();

  const { id } = await context.params;
  const body = await request.json();

  try {
    if (body.action === "start") {
      const liveClass = await startLiveClassAsAdmin(id);
      return NextResponse.json({ ok: true, status: liveClass.status });
    }

    if (body.action === "end") {
      const liveClass = await endLiveClassAsAdmin(id);
      return NextResponse.json({ ok: true, status: liveClass.status });
    }

    if (body.action === "update") {
      const liveClass = await updateLiveClassAsAdmin(id, {
        title: body.title,
        description: body.description,
        courseId: body.courseId,
        lecturerId: body.lecturerId,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime === null ? null : body.endTime ? new Date(body.endTime) : undefined,
      });
      return NextResponse.json({
        ok: true,
        class: {
          id: liveClass.id,
          title: liveClass.title,
          status: liveClass.status,
          startTime: liveClass.startTime?.toISOString() ?? null,
          endTime: liveClass.endTime?.toISOString() ?? null,
          course: liveClass.course,
          lecturerName: liveClass.lecturer?.user.fullName ?? null,
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
  const admin = await requireAdminUser();
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const liveClass = await cancelLiveClassAsAdmin(id);
    return NextResponse.json({ ok: true, status: liveClass.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel class.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
