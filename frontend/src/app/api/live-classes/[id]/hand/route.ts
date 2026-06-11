import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getValidatedUser, requireStudent } from "@/lib/auth";
import { buildFeeLockResponse } from "@/lib/student-fee-guard";
import { emitSocketEvent, SOCKET_EVENTS } from "@/lib/socket-emitter";
import { liveClassRoom } from "@/lib/socket-events";
import {
  assertLiveClassParticipant,
  getLiveClassAccess,
  lowerAllHands,
  lowerHand,
  raiseHand,
} from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getValidatedUser(["lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const access = await getLiveClassAccess(id, user.id, user.role as Role);
  if (!access.ok || !access.isModerator) {
    return NextResponse.json({ error: "Only the session host can view raised hands." }, { status: 403 });
  }

  const raises = await prisma.liveClassHandRaise.findMany({
    where: { liveClassId: id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    raises: raises.map((item) => ({
      id: item.id,
      studentId: item.studentId,
      studentName: item.studentName,
      createdAt: item.createdAt.toISOString(),
    })),
    count: raises.length,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  if (body.action === "raise" || body.action === "lower") {
    const student = await requireStudent();
    if (!student) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const locked = await buildFeeLockResponse(student.id, "live");
    if (locked) return locked;

    try {
      await assertLiveClassParticipant(id, student.userId, Role.STUDENT);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Access denied.";
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (body.action === "raise") {
      await raiseHand(id, student.id, student.user.fullName);
    } else {
      await lowerHand(id, student.id);
    }

    emitSocketEvent(liveClassRoom(id), SOCKET_EVENTS.LIVE_HAND, {
      liveClassId: id,
      action: body.action,
      studentId: student.id,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "dismiss" || body.action === "lower_all") {
    const user = await getValidatedUser(["lecturer", "admin"]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const access = await getLiveClassAccess(id, user.id, user.role as Role);
    if (!access.ok || !access.isModerator) {
      return NextResponse.json({ error: "Only the session host can manage raised hands." }, { status: 403 });
    }

    if (body.action === "lower_all") {
      await lowerAllHands(id);
    } else if (body.studentId) {
      await lowerHand(id, body.studentId);
    } else {
      return NextResponse.json({ error: "Student id is required." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
