import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getValidatedUser } from "@/lib/auth";
import { PortalChatKind, PortalChatMessageType } from "@prisma/client";
import { guardStudentUserFeeAccess } from "@/lib/student-fee-guard";
import { emitSocketEvent, SOCKET_EVENTS } from "@/lib/socket-emitter";
import { liveClassRoom, threadRoom } from "@/lib/socket-events";
import { assertLiveClassParticipant } from "@/lib/live-class-service";
import {
  courseThreadKey,
  liveClassThreadKey,
  listThreadMessages,
  moderateLiveClassMessage,
  sendPortalChatMessage,
} from "@/lib/portal-chat-service";

type RouteContext = { params: Promise<{ id: string }> };

function resolveThread(access: Awaited<ReturnType<typeof assertLiveClassParticipant>>) {
  const courseId = access.liveClass.courseId;
  if (courseId) {
    return { kind: PortalChatKind.COURSE, threadKey: courseThreadKey(courseId), courseId };
  }
  return {
    kind: PortalChatKind.LIVE_CLASS,
    threadKey: liveClassThreadKey(access.liveClass.id),
    liveClassId: access.liveClass.id,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getValidatedUser(["student", "lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.role === Role.STUDENT) {
    const locked = await guardStudentUserFeeAccess(user.id, "live");
    if (locked) return locked;
  }

  try {
    const access = await assertLiveClassParticipant(id, user.id, user.role);
    const thread = resolveThread(access);
    const messages = await listThreadMessages(thread.threadKey, 80, user.id);
    return NextResponse.json({
      messages,
      currentUserId: user.id,
      isHost: access.isModerator ?? false,
      endTime: access.liveClass.endTime?.toISOString() ?? null,
      hostName:
        access.liveClass.lecturer?.user.fullName ??
        access.liveClass.createdBy?.fullName ??
        "Host",
      ...thread,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not load messages.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getValidatedUser(["student", "lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.role === Role.STUDENT) {
    const locked = await guardStudentUserFeeAccess(user.id, "live");
    if (locked) return locked;
  }

  const body = await request.json();

  if (body.messageType === "VOICE") {
    return NextResponse.json(
      { error: "Voice messages are not allowed in live sessions." },
      { status: 400 },
    );
  }

  try {
    const access = await assertLiveClassParticipant(id, user.id, user.role);
    const thread = resolveThread(access);

    const message = await sendPortalChatMessage({
      senderId: user.id,
      role: user.role as Role,
      kind: thread.kind,
      body: body.body ?? "",
      messageType: PortalChatMessageType.TEXT,
      audioData: null,
      courseId: thread.kind === PortalChatKind.COURSE ? thread.courseId : null,
      liveClassId: thread.kind === PortalChatKind.LIVE_CLASS ? thread.liveClassId : null,
    });

    emitSocketEvent(threadRoom(message.threadKey), SOCKET_EVENTS.LIVE_CHAT, {
      liveClassId: id,
      threadKey: message.threadKey,
      message: {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        senderId: message.senderId,
        senderName: message.sender.fullName,
        senderRole: message.sender.role,
      },
    });
    emitSocketEvent(liveClassRoom(id), SOCKET_EVENTS.LIVE_CHAT, {
      liveClassId: id,
      threadKey: message.threadKey,
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        body: message.body,
        messageType: message.messageType,
        audioData: message.audioData,
        createdAt: message.createdAt.toISOString(),
        senderId: message.senderId,
        senderName: message.sender.fullName,
        senderRole: message.sender.role,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not send message.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getValidatedUser(["lecturer", "admin"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as "delete" | "pin" | "highlight" | "unpin" | "unhighlight";
  if (!action || !body.messageId) {
    return NextResponse.json({ error: "Action and message id are required." }, { status: 400 });
  }

  try {
    await moderateLiveClassMessage({
      messageId: body.messageId,
      actorUserId: user.id,
      role: user.role as Role,
      liveClassId: id,
      action,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not moderate message.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
