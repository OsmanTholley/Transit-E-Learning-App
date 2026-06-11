import { PortalChatKind, PortalChatMessageType, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  addGroupMembers,
  createChatGroup,
  deleteChatGroup,
  deletePortalChatMessage,
  directThreadKey,
  getUnreadCountsByThread,
  groupThreadKey,
  listFilterOptions,
  listDirectThreadContacts,
  listAdminCourseRooms,
  listLecturerCourseRooms,
  listMessengerContacts,
  listStudentCourseRooms,
  listThreadMessages,
  listUserGroups,
  markThreadRead,
  moderateLiveClassMessage,
  removeGroupMember,
  sendPortalChatMessage,
  updateChatGroup,
  updatePortalChatMessage,
} from "@/lib/portal-chat-service";
import { emitSocketEvent, SOCKET_EVENTS } from "@/lib/socket-emitter";
import { threadRoom } from "@/lib/socket-events";

function parseChatKind(value: string | null | undefined): PortalChatKind {
  if (value === "DIRECT") return PortalChatKind.DIRECT;
  if (value === "GROUP") return PortalChatKind.GROUP;
  if (value === "LIVE_CLASS") return PortalChatKind.LIVE_CLASS;
  return PortalChatKind.COURSE;
}

async function collectInboxThreadKeys(userId: string, role: Role) {
  const [directThreads, groups, courseRooms] = await Promise.all([
    listDirectThreadContacts(userId),
    listUserGroups(userId),
    role === Role.STUDENT
      ? listStudentCourseRooms(userId)
      : role === Role.ADMIN
        ? listAdminCourseRooms()
        : listLecturerCourseRooms(userId),
  ]);

  const contacts = await listMessengerContacts(userId, role);
  const threadKeys = [
    ...contacts.map((c) => c.threadKey),
    ...directThreads.map((c) => c.threadKey),
    ...groups.map((g) => g.threadKey),
    ...courseRooms.map((r) => r.threadKey),
  ];

  return { contacts, directThreads, groups, courseRooms, threadKeys: [...new Set(threadKeys)] };
}

export async function handlePortalChatGet(
  request: NextRequest,
  user: { id: string },
  role: Role
) {
  const kind = request.nextUrl.searchParams.get("kind");
  const courseId = request.nextUrl.searchParams.get("courseId");
  const peerUserId = request.nextUrl.searchParams.get("peerUserId");
  const groupId = request.nextUrl.searchParams.get("groupId");

  if (kind === "messages") {
    const threadKind = parseChatKind(request.nextUrl.searchParams.get("threadKind"));
    const threadKey =
      threadKind === PortalChatKind.DIRECT && peerUserId
        ? directThreadKey(user.id, peerUserId)
        : threadKind === PortalChatKind.GROUP && groupId
          ? groupThreadKey(groupId)
          : courseId
            ? `course:${courseId}`
            : null;

    if (!threadKey) {
      return NextResponse.json({ error: "Thread is required." }, { status: 400 });
    }

    const messages = await listThreadMessages(threadKey, 80, user.id);
    await markThreadRead(user.id, threadKey);
    return NextResponse.json({ messages });
  }

  const [filters, inbox] = await Promise.all([
    listFilterOptions(),
    collectInboxThreadKeys(user.id, role),
  ]);

  const unreadByThread = await getUnreadCountsByThread(user.id, inbox.threadKeys);
  const totalUnread = Object.values(unreadByThread).reduce((sum, count) => sum + count, 0);

  return NextResponse.json({
    contacts: inbox.contacts,
    directThreads: inbox.directThreads,
    groups: inbox.groups.map((group) => ({
      ...group,
      unreadCount: unreadByThread[group.threadKey] ?? 0,
    })),
    courseRooms: inbox.courseRooms.map((room) => ({
      ...room,
      unreadCount: unreadByThread[room.threadKey] ?? 0,
    })),
    filters,
    unreadByThread,
    totalUnread,
    currentUserId: user.id,
  });
}

export async function handlePortalChatPost(
  request: NextRequest,
  user: { id: string },
  role: Role
) {
  const body = await request.json();

  if (body.action === "createGroup") {
    try {
      const group = await createChatGroup({
        creatorId: user.id,
        role,
        name: body.name ?? "",
        description: body.description ?? null,
        memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
      });
      return NextResponse.json({ ok: true, group });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not create group.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const kind = parseChatKind(body.kind);

  try {
    const message = await sendPortalChatMessage({
      senderId: user.id,
      role,
      kind,
      body: body.body ?? "",
      messageType: body.messageType === "VOICE" ? PortalChatMessageType.VOICE : PortalChatMessageType.TEXT,
      audioData: body.audioData ?? null,
      courseId: body.courseId ?? null,
      peerUserId: body.peerUserId ?? null,
      groupId: body.groupId ?? null,
    });

    emitSocketEvent(threadRoom(message.threadKey), SOCKET_EVENTS.CHAT_MESSAGE, {
      threadKey: message.threadKey,
      message: {
        id: message.id,
        body: message.body,
        messageType: message.messageType,
        audioData: message.audioData,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        senderId: message.senderId,
        senderName: message.sender.fullName,
        senderRole: message.sender.role,
        edited: false,
        readStatus: "delivered",
      },
    });

    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        body: message.body,
        messageType: message.messageType,
        audioData: message.audioData,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        senderId: message.senderId,
        senderName: message.sender.fullName,
        senderRole: message.sender.role,
        edited: false,
        readStatus: "delivered",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not send message.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function handlePortalChatPatch(
  request: NextRequest,
  user: { id: string },
  role: Role
) {
  const body = await request.json();

  if (body.action === "markRead") {
    const threadKey = body.threadKey as string;
    if (!threadKey) {
      return NextResponse.json({ error: "Thread key is required." }, { status: 400 });
    }
    await markThreadRead(user.id, threadKey);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "updateMessage") {
    try {
      const message = await updatePortalChatMessage({
        messageId: body.messageId,
        userId: user.id,
        body: body.body ?? "",
      });
      return NextResponse.json({
        ok: true,
        message: {
          id: message.id,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
          senderId: message.senderId,
          senderName: message.sender.fullName,
          senderRole: message.sender.role,
          edited: true,
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not update message.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (body.action === "updateGroup") {
    try {
      const group = await updateChatGroup({
        groupId: body.groupId,
        userId: user.id,
        name: body.name,
        description: body.description,
      });
      return NextResponse.json({ ok: true, group });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not update group.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (body.action === "addMembers") {
    try {
      const group = await addGroupMembers({
        groupId: body.groupId,
        userId: user.id,
        role,
        memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
      });
      return NextResponse.json({ ok: true, group });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not add members.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function handlePortalChatDelete(request: NextRequest, user: { id: string }, _role: Role) {
  const body = await request.json();

  if (body.action === "deleteMessage") {
    try {
      await deletePortalChatMessage({ messageId: body.messageId, userId: user.id });
      return NextResponse.json({ ok: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not delete message.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (body.action === "deleteGroup") {
    try {
      await deleteChatGroup({ groupId: body.groupId, userId: user.id });
      return NextResponse.json({ ok: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not delete group.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (body.action === "removeMember") {
    try {
      await removeGroupMember({
        groupId: body.groupId,
        actorId: user.id,
        memberId: body.memberId,
      });
      return NextResponse.json({ ok: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not remove member.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export { moderateLiveClassMessage };
