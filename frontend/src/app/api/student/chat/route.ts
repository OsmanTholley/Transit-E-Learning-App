import { PortalChatKind, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getValidatedUser } from "@/lib/auth";
import {
  listStudentCourseRooms,
  listStudentDirectContacts,
  listThreadMessages,
  sendPortalChatMessage,
} from "@/lib/portal-chat-service";

export async function GET(request: NextRequest) {
  const user = await getValidatedUser(["student"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const kind = request.nextUrl.searchParams.get("kind");
  const courseId = request.nextUrl.searchParams.get("courseId");
  const peerUserId = request.nextUrl.searchParams.get("peerUserId");

  if (kind === "messages") {
    const threadKind = request.nextUrl.searchParams.get("threadKind") as PortalChatKind | null;
    const threadKey =
      threadKind === PortalChatKind.DIRECT && peerUserId
        ? `direct:${[user.id, peerUserId].sort().join(":")}`
        : courseId
          ? `course:${courseId}`
          : null;

    if (!threadKey) {
      return NextResponse.json({ error: "Thread is required." }, { status: 400 });
    }

    const messages = await listThreadMessages(threadKey);
    return NextResponse.json({ messages });
  }

  const [courseRooms, directContacts] = await Promise.all([
    listStudentCourseRooms(user.id),
    listStudentDirectContacts(user.id),
  ]);

  return NextResponse.json({ courseRooms, directContacts });
}

export async function POST(request: NextRequest) {
  const user = await getValidatedUser(["student"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const kind = body.kind === "DIRECT" ? PortalChatKind.DIRECT : PortalChatKind.COURSE;

  try {
    const message = await sendPortalChatMessage({
      senderId: user.id,
      role: Role.STUDENT,
      kind,
      body: body.body ?? "",
      courseId: body.courseId ?? null,
      peerUserId: body.peerUserId ?? null,
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        body: message.body,
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
