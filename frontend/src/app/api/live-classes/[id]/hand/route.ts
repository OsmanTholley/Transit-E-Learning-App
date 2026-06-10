import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireLecturer, requireStudent } from "@/lib/auth";
import { assertLiveClassParticipant, lowerHand, raiseHand } from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const lecturer = await requireLecturer();
  if (!lecturer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  const liveClass = await prisma.liveClass.findUnique({ where: { id } });
  if (!liveClass || liveClass.lecturerId !== lecturer.id) {
    return NextResponse.json({ error: "Live class not found." }, { status: 404 });
  }

  const raises = await prisma.liveClassHandRaise.findMany({
    where: { liveClassId: id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    raises: raises.map((item) => ({
      id: item.id,
      studentName: item.studentName,
      createdAt: item.createdAt.toISOString(),
    })),
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

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
