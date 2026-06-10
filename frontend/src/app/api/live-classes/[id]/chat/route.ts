import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser } from "@/lib/auth";
import { assertLiveClassParticipant, postLiveClassMessage } from "@/lib/live-class-service";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getValidatedUser(["student", "lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await assertLiveClassParticipant(id, user.id, user.role);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const messages = await prisma.liveClassChatMessage.findMany({
    where: { liveClassId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    messages: messages.map((message) => ({
      id: message.id,
      senderName: message.senderName,
      senderRole: message.senderRole,
      message: message.message,
      createdAt: message.createdAt.toISOString(),
      isMine: message.userId === user.id,
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getValidatedUser(["student", "lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  try {
    await assertLiveClassParticipant(id, user.id, user.role);
    const message = await postLiveClassMessage({
      liveClassId: id,
      userId: user.id,
      senderName: user.fullName,
      senderRole: user.role,
      message: body.message ?? "",
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        senderName: message.senderName,
        senderRole: message.senderRole,
        message: message.message,
        createdAt: message.createdAt.toISOString(),
        isMine: true,
      },
    });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Failed to send message.";
    return NextResponse.json({ error: text }, { status: 400 });
  }
}
