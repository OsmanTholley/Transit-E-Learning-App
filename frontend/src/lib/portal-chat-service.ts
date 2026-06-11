import { PortalChatKind, PortalChatMessageType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MessengerContact = {
  userId: string;
  fullName: string;
  role: Role;
  studentId?: string | null;
  staffId?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  programId?: string | null;
  programName?: string | null;
  threadKey: string;
};

export type MessengerGroup = {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  memberCount: number;
  threadKey: string;
  members: Array<{
    userId: string;
    fullName: string;
    role: Role;
  }>;
};

export type MessengerFilterOption = {
  id: string;
  name: string;
};

export function courseThreadKey(courseId: string) {
  return `course:${courseId}`;
}

export function directThreadKey(userIdA: string, userIdB: string) {
  const [a, b] = [userIdA, userIdB].sort();
  return `direct:${a}:${b}`;
}

export function groupThreadKey(groupId: string) {
  return `group:${groupId}`;
}

export function liveClassThreadKey(liveClassId: string) {
  return `liveclass:${liveClassId}`;
}

export async function listFilterOptions() {
  const [departments, programs] = await Promise.all([
    prisma.department.findMany({
      select: { id: true, departmentName: true },
      orderBy: { departmentName: "asc" },
    }),
    prisma.program.findMany({
      select: { id: true, programName: true, departmentId: true },
      orderBy: { programName: "asc" },
    }),
  ]);

  return {
    departments: departments.map((d) => ({ id: d.id, name: d.departmentName })),
    programs: programs.map((p) => ({
      id: p.id,
      name: p.programName,
      departmentId: p.departmentId,
    })),
  };
}

export async function listMessengerContacts(userId: string, role: Role): Promise<MessengerContact[]> {
  const contacts: MessengerContact[] = [];

  if (role === Role.STUDENT) {
    const students = await prisma.student.findMany({
      where: { userId: { not: userId }, user: { isActive: true } },
      include: {
        user: { select: { id: true, fullName: true, role: true } },
        department: { select: { id: true, departmentName: true } },
        program: { select: { id: true, programName: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const student of students) {
      contacts.push({
        userId: student.user.id,
        fullName: student.user.fullName,
        role: student.user.role,
        studentId: student.studentId,
        departmentId: student.departmentId,
        departmentName: student.department?.departmentName ?? null,
        programId: student.programId,
        programName: student.program?.programName ?? null,
        threadKey: directThreadKey(userId, student.user.id),
      });
    }

    const lecturers = await prisma.lecturer.findMany({
      where: { user: { isActive: true } },
      include: { user: { select: { id: true, fullName: true, role: true } } },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const lecturer of lecturers) {
      contacts.push({
        userId: lecturer.user.id,
        fullName: lecturer.user.fullName,
        role: lecturer.user.role,
        staffId: lecturer.staffId,
        threadKey: directThreadKey(userId, lecturer.user.id),
      });
    }
  }

  if (role === Role.LECTURER) {
    const students = await prisma.student.findMany({
      where: { user: { isActive: true } },
      include: {
        user: { select: { id: true, fullName: true, role: true } },
        department: { select: { id: true, departmentName: true } },
        program: { select: { id: true, programName: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const student of students) {
      if (student.userId === userId) continue;
      contacts.push({
        userId: student.user.id,
        fullName: student.user.fullName,
        role: student.user.role,
        studentId: student.studentId,
        departmentId: student.departmentId,
        departmentName: student.department?.departmentName ?? null,
        programId: student.programId,
        programName: student.program?.programName ?? null,
        threadKey: directThreadKey(userId, student.user.id),
      });
    }

    const lecturers = await prisma.lecturer.findMany({
      where: { user: { isActive: true, id: { not: userId } } },
      include: { user: { select: { id: true, fullName: true, role: true } } },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const lecturer of lecturers) {
      contacts.push({
        userId: lecturer.user.id,
        fullName: lecturer.user.fullName,
        role: lecturer.user.role,
        staffId: lecturer.staffId,
        threadKey: directThreadKey(userId, lecturer.user.id),
      });
    }

    const admins = await prisma.admin.findMany({
      where: { user: { isActive: true } },
      include: { user: { select: { id: true, fullName: true, role: true } } },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const admin of admins) {
      contacts.push({
        userId: admin.user.id,
        fullName: admin.user.fullName,
        role: admin.user.role,
        threadKey: directThreadKey(userId, admin.user.id),
      });
    }
  }

  if (role === Role.ADMIN) {
    const students = await prisma.student.findMany({
      where: { user: { isActive: true } },
      include: {
        user: { select: { id: true, fullName: true, role: true } },
        department: { select: { id: true, departmentName: true } },
        program: { select: { id: true, programName: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const student of students) {
      if (student.userId === userId) continue;
      contacts.push({
        userId: student.user.id,
        fullName: student.user.fullName,
        role: student.user.role,
        studentId: student.studentId,
        departmentId: student.departmentId,
        departmentName: student.department?.departmentName ?? null,
        programId: student.programId,
        programName: student.program?.programName ?? null,
        threadKey: directThreadKey(userId, student.user.id),
      });
    }

    const lecturers = await prisma.lecturer.findMany({
      where: { user: { isActive: true } },
      include: { user: { select: { id: true, fullName: true, role: true } } },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const lecturer of lecturers) {
      contacts.push({
        userId: lecturer.user.id,
        fullName: lecturer.user.fullName,
        role: lecturer.user.role,
        staffId: lecturer.staffId,
        threadKey: directThreadKey(userId, lecturer.user.id),
      });
    }

    const admins = await prisma.admin.findMany({
      where: { user: { isActive: true, id: { not: userId } } },
      include: { user: { select: { id: true, fullName: true, role: true } } },
      orderBy: { user: { fullName: "asc" } },
    });

    for (const admin of admins) {
      contacts.push({
        userId: admin.user.id,
        fullName: admin.user.fullName,
        role: admin.user.role,
        threadKey: directThreadKey(userId, admin.user.id),
      });
    }
  }

  return contacts;
}

export async function listUserGroups(userId: string): Promise<MessengerGroup[]> {
  const memberships = await prisma.chatGroupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
        },
      },
    },
    orderBy: { group: { updatedAt: "desc" } },
  });

  return memberships.map(({ group }) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    createdById: group.createdById,
    memberCount: group.members.length,
    threadKey: groupThreadKey(group.id),
    members: group.members.map((m) => ({
      userId: m.user.id,
      fullName: m.user.fullName,
      role: m.user.role,
    })),
  }));
}

export function peerFromDirectThreadKey(threadKey: string, userId: string): string | null {
  if (!threadKey.startsWith("direct:")) return null;
  const [peerA, peerB] = threadKey.slice("direct:".length).split(":");
  if (!peerA || !peerB) return null;
  if (peerA === userId) return peerB;
  if (peerB === userId) return peerA;
  return null;
}

export async function listDirectThreadContacts(userId: string): Promise<MessengerContact[]> {
  const rows = await prisma.portalChatMessage.groupBy({
    by: ["threadKey"],
    where: {
      kind: PortalChatKind.DIRECT,
      OR: [{ threadKey: { startsWith: `direct:${userId}:` } }, { threadKey: { endsWith: `:${userId}` } }],
    },
  });

  const peerIds = [
    ...new Set(
      rows.map((row) => peerFromDirectThreadKey(row.threadKey, userId)).filter((id): id is string => id != null),
    ),
  ];
  if (peerIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: peerIds }, isActive: true },
    select: {
      id: true,
      fullName: true,
      role: true,
      student: {
        select: {
          studentId: true,
          departmentId: true,
          department: { select: { departmentName: true } },
          programId: true,
          program: { select: { programName: true } },
        },
      },
      lecturer: { select: { staffId: true } },
    },
    orderBy: { fullName: "asc" },
  });

  return users.map((user) => ({
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
    studentId: user.student?.studentId ?? null,
    staffId: user.lecturer?.staffId ?? null,
    departmentId: user.student?.departmentId ?? null,
    departmentName: user.student?.department?.departmentName ?? null,
    programId: user.student?.programId ?? null,
    programName: user.student?.program?.programName ?? null,
    threadKey: directThreadKey(userId, user.id),
  }));
}

export async function assertCanMessagePeer(userId: string, role: Role, peerUserId: string) {
  const peer = await prisma.user.findUnique({
    where: { id: peerUserId },
    select: { role: true, isActive: true },
  });
  if (!peer?.isActive) throw new Error("You cannot message this user.");

  if (role === Role.STUDENT && peer.role === Role.ADMIN) {
    const threadKey = directThreadKey(userId, peerUserId);
    const adminStarted = await prisma.portalChatMessage.findFirst({
      where: { threadKey, sender: { role: Role.ADMIN } },
      select: { id: true },
    });
    if (!adminStarted) {
      throw new Error("You can only reply after an admin starts the conversation.");
    }
    return;
  }

  const contacts = await listMessengerContacts(userId, role);
  if (contacts.some((c) => c.userId === peerUserId)) return;

  const threadContacts = await listDirectThreadContacts(userId);
  if (!threadContacts.some((c) => c.userId === peerUserId)) {
    throw new Error("You cannot message this user.");
  }
}

export async function assertGroupMember(userId: string, groupId: string) {
  const member = await prisma.chatGroupMember.findFirst({
    where: { groupId, userId },
  });
  if (!member) throw new Error("You are not a member of this group.");
}

export async function assertCanAccessThread(params: {
  userId: string;
  role: Role;
  kind: PortalChatKind;
  courseId?: string | null;
  peerUserId?: string | null;
  groupId?: string | null;
  liveClassId?: string | null;
}) {
  if (params.kind === PortalChatKind.GROUP) {
    if (!params.groupId) throw new Error("Group is required.");
    await assertGroupMember(params.userId, params.groupId);
    return;
  }

  if (params.kind === PortalChatKind.COURSE) {
    if (!params.courseId) throw new Error("Course is required.");

    if (params.role === Role.STUDENT) {
      const student = await prisma.student.findFirst({ where: { userId: params.userId } });
      if (!student) throw new Error("Unauthorized.");
      const enrolled = await prisma.courseStudent.findFirst({
        where: { studentId: student.id, courseId: params.courseId },
      });
      if (!enrolled) throw new Error("You are not enrolled in this course.");
      return;
    }

    if (params.role === Role.LECTURER) {
      const lecturer = await prisma.lecturer.findFirst({ where: { userId: params.userId } });
      if (!lecturer) throw new Error("Unauthorized.");
      const course = await prisma.course.findFirst({
        where: { id: params.courseId, lecturerId: lecturer.id },
      });
      if (!course) throw new Error("You are not assigned to this course.");
      return;
    }

    if (params.role === Role.ADMIN) {
      const course = await prisma.course.findFirst({ where: { id: params.courseId } });
      if (!course) throw new Error("Course not found.");
      return;
    }

    throw new Error("Unauthorized.");
  }

  if (params.kind === PortalChatKind.LIVE_CLASS) {
    if (!params.liveClassId) throw new Error("Live class is required.");
    const { assertLiveClassParticipant } = await import("@/lib/live-class-service");
    await assertLiveClassParticipant(params.liveClassId, params.userId, params.role);
    return;
  }

  if (!params.peerUserId) throw new Error("Recipient is required.");
  await assertCanMessagePeer(params.userId, params.role, params.peerUserId);
}

export async function listThreadMessages(threadKey: string, limit = 80, viewerUserId?: string) {
  const messages = await prisma.portalChatMessage.findMany({
    where: { threadKey, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  let peerLastReadAt: Date | null = null;
  if (viewerUserId && threadKey.startsWith("direct:")) {
    const peerId = peerFromDirectThreadKey(threadKey, viewerUserId);
    if (peerId) {
      const peerRead = await prisma.portalChatThreadRead.findUnique({
        where: { userId_threadKey: { userId: peerId, threadKey } },
      });
      peerLastReadAt = peerRead?.lastReadAt ?? null;
    }
  }

  return messages.map((message) => {
    let readStatus: "sent" | "delivered" | "read" | undefined;
    if (viewerUserId && message.senderId === viewerUserId && threadKey.startsWith("direct:")) {
      readStatus = peerLastReadAt && message.createdAt <= peerLastReadAt ? "read" : "delivered";
    }

    return {
      id: message.id,
      body: message.body,
      messageType: message.messageType,
      audioData: message.audioData,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      senderId: message.senderId,
      senderName: message.sender.fullName,
      senderRole: message.sender.role,
      edited: message.updatedAt.getTime() > message.createdAt.getTime() + 1000,
      isPinned: message.isPinned,
      isHighlighted: message.isHighlighted,
      readStatus,
    };
  });
}

export async function markThreadRead(userId: string, threadKey: string) {
  const now = new Date();
  return prisma.portalChatThreadRead.upsert({
    where: { userId_threadKey: { userId, threadKey } },
    create: { userId, threadKey, lastReadAt: now },
    update: { lastReadAt: now },
  });
}

export async function getUnreadCountsByThread(userId: string, threadKeys: string[]) {
  if (threadKeys.length === 0) return {} as Record<string, number>;

  const reads = await prisma.portalChatThreadRead.findMany({
    where: { userId, threadKey: { in: threadKeys } },
  });
  const readMap = new Map(reads.map((read) => [read.threadKey, read.lastReadAt]));

  const counts: Record<string, number> = {};
  await Promise.all(
    threadKeys.map(async (threadKey) => {
      const since = readMap.get(threadKey) ?? new Date(0);
      counts[threadKey] = await prisma.portalChatMessage.count({
        where: {
          threadKey,
          senderId: { not: userId },
          createdAt: { gt: since },
          deletedAt: null,
        },
      });
    }),
  );
  return counts;
}

export async function moderateLiveClassMessage(params: {
  messageId: string;
  actorUserId: string;
  role: Role;
  liveClassId: string;
  action: "delete" | "pin" | "highlight" | "unpin" | "unhighlight";
}) {
  const { assertLiveClassParticipant } = await import("@/lib/live-class-service");
  const access = await assertLiveClassParticipant(params.liveClassId, params.actorUserId, params.role);
  if (!access.isModerator) {
    throw new Error("Only the session host can moderate chat.");
  }

  const message = await prisma.portalChatMessage.findUnique({ where: { id: params.messageId } });
  if (!message) throw new Error("Message not found.");

  if (params.action === "delete") {
    return prisma.portalChatMessage.update({
      where: { id: params.messageId },
      data: { deletedAt: new Date() },
    });
  }

  if (params.action === "pin") {
    await prisma.portalChatMessage.updateMany({
      where: { threadKey: message.threadKey, isPinned: true },
      data: { isPinned: false },
    });
    return prisma.portalChatMessage.update({
      where: { id: params.messageId },
      data: { isPinned: true },
    });
  }

  if (params.action === "unpin") {
    return prisma.portalChatMessage.update({
      where: { id: params.messageId },
      data: { isPinned: false },
    });
  }

  return prisma.portalChatMessage.update({
    where: { id: params.messageId },
    data: { isHighlighted: params.action === "highlight" },
  });
}

export async function sendPortalChatMessage(params: {
  senderId: string;
  role: Role;
  kind: PortalChatKind;
  body?: string;
  messageType?: PortalChatMessageType;
  audioData?: string | null;
  courseId?: string | null;
  peerUserId?: string | null;
  groupId?: string | null;
  liveClassId?: string | null;
}) {
  const messageType = params.messageType ?? PortalChatMessageType.TEXT;
  const text = (params.body ?? "").trim();
  const audioData = params.audioData?.trim() || null;

  if (messageType === PortalChatMessageType.VOICE) {
    if (!audioData) throw new Error("Voice message is empty.");
    if (params.kind !== PortalChatKind.DIRECT) {
      throw new Error("Voice messages are only allowed in direct chat.");
    }
  } else if (!text) {
    throw new Error("Message cannot be empty.");
  }

  await assertCanAccessThread({
    userId: params.senderId,
    role: params.role,
    kind: params.kind,
    courseId: params.courseId,
    peerUserId: params.peerUserId,
    groupId: params.groupId,
    liveClassId: params.liveClassId,
  });

  const threadKey =
    params.kind === PortalChatKind.COURSE
      ? courseThreadKey(params.courseId!)
      : params.kind === PortalChatKind.GROUP
        ? groupThreadKey(params.groupId!)
        : params.kind === PortalChatKind.LIVE_CLASS
          ? liveClassThreadKey(params.liveClassId!)
          : directThreadKey(params.senderId, params.peerUserId!);

  const message = await prisma.portalChatMessage.create({
    data: {
      kind: params.kind,
      messageType,
      courseId: params.kind === PortalChatKind.COURSE ? params.courseId! : null,
      groupId: params.kind === PortalChatKind.GROUP ? params.groupId! : null,
      liveClassId: params.kind === PortalChatKind.LIVE_CLASS ? params.liveClassId! : null,
      threadKey,
      senderId: params.senderId,
      body: text,
      audioData: messageType === PortalChatMessageType.VOICE ? audioData : null,
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  if (params.kind === PortalChatKind.GROUP && params.groupId) {
    await prisma.chatGroup.update({
      where: { id: params.groupId },
      data: { updatedAt: new Date() },
    });
  }

  return message;
}

export async function updatePortalChatMessage(params: {
  messageId: string;
  userId: string;
  body: string;
}) {
  const text = params.body.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const message = await prisma.portalChatMessage.findUnique({
    where: { id: params.messageId },
  });
  if (!message) throw new Error("Message not found.");
  if (message.senderId !== params.userId) throw new Error("You can only edit your own messages.");

  return prisma.portalChatMessage.update({
    where: { id: params.messageId },
    data: { body: text },
    include: { sender: { select: { id: true, fullName: true, role: true } } },
  });
}

export async function deletePortalChatMessage(params: { messageId: string; userId: string }) {
  const message = await prisma.portalChatMessage.findUnique({
    where: { id: params.messageId },
  });
  if (!message) throw new Error("Message not found.");
  if (message.senderId !== params.userId) throw new Error("You can only delete your own messages.");

  await prisma.portalChatMessage.delete({ where: { id: params.messageId } });
}

export async function createChatGroup(params: {
  creatorId: string;
  role: Role;
  name: string;
  description?: string | null;
  memberIds: string[];
}) {
  const name = params.name.trim();
  if (!name) throw new Error("Group name is required.");

  const uniqueMemberIds = [...new Set([params.creatorId, ...params.memberIds])];
  const contacts = await listMessengerContacts(params.creatorId, params.role);
  const allowedIds = new Set(contacts.map((c) => c.userId));

  for (const memberId of uniqueMemberIds) {
    if (memberId === params.creatorId) continue;
    if (!allowedIds.has(memberId)) {
      throw new Error("One or more members cannot be added to this group.");
    }
  }

  const group = await prisma.chatGroup.create({
    data: {
      name,
      description: params.description?.trim() || null,
      createdById: params.creatorId,
      members: {
        create: uniqueMemberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, fullName: true, role: true } } },
      },
    },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdById: group.createdById,
    memberCount: group.members.length,
    threadKey: groupThreadKey(group.id),
    members: group.members.map((m) => ({
      userId: m.user.id,
      fullName: m.user.fullName,
      role: m.user.role,
    })),
  };
}

export async function updateChatGroup(params: {
  groupId: string;
  userId: string;
  name?: string;
  description?: string | null;
}) {
  const group = await prisma.chatGroup.findUnique({ where: { id: params.groupId } });
  if (!group) throw new Error("Group not found.");
  if (group.createdById !== params.userId) throw new Error("Only the group creator can edit the group.");

  const name = params.name?.trim();
  if (name !== undefined && !name) throw new Error("Group name cannot be empty.");

  const updated = await prisma.chatGroup.update({
    where: { id: params.groupId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(params.description !== undefined ? { description: params.description?.trim() || null } : {}),
    },
    include: {
      members: {
        include: { user: { select: { id: true, fullName: true, role: true } } },
      },
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    createdById: updated.createdById,
    memberCount: updated.members.length,
    threadKey: groupThreadKey(updated.id),
    members: updated.members.map((m) => ({
      userId: m.user.id,
      fullName: m.user.fullName,
      role: m.user.role,
    })),
  };
}

export async function deleteChatGroup(params: { groupId: string; userId: string }) {
  const group = await prisma.chatGroup.findUnique({ where: { id: params.groupId } });
  if (!group) throw new Error("Group not found.");
  if (group.createdById !== params.userId) throw new Error("Only the group creator can delete the group.");

  await prisma.chatGroup.delete({ where: { id: params.groupId } });
}

export async function addGroupMembers(params: {
  groupId: string;
  userId: string;
  role: Role;
  memberIds: string[];
}) {
  const group = await prisma.chatGroup.findUnique({ where: { id: params.groupId } });
  if (!group) throw new Error("Group not found.");
  if (group.createdById !== params.userId) throw new Error("Only the group creator can add members.");

  const contacts = await listMessengerContacts(params.userId, params.role);
  const allowedIds = new Set(contacts.map((c) => c.userId));

  for (const memberId of params.memberIds) {
    if (!allowedIds.has(memberId)) {
      throw new Error("One or more members cannot be added.");
    }
  }

  await prisma.chatGroupMember.createMany({
    data: params.memberIds.map((memberId) => ({ groupId: params.groupId, userId: memberId })),
    skipDuplicates: true,
  });

  return listUserGroups(params.userId).then((groups) => groups.find((g) => g.id === params.groupId)!);
}

export async function removeGroupMember(params: { groupId: string; actorId: string; memberId: string }) {
  const group = await prisma.chatGroup.findUnique({ where: { id: params.groupId } });
  if (!group) throw new Error("Group not found.");

  const isCreator = group.createdById === params.actorId;
  const isSelf = params.memberId === params.actorId;

  if (!isCreator && !isSelf) {
    throw new Error("You can only remove yourself or members if you created the group.");
  }

  await prisma.chatGroupMember.deleteMany({
    where: { groupId: params.groupId, userId: params.memberId },
  });
}

// Legacy helpers kept for course room support
export async function listStudentCourseRooms(studentUserId: string) {
  const student = await prisma.student.findFirst({
    where: { userId: studentUserId },
    include: {
      courseStudents: {
        include: {
          course: {
            select: {
              id: true,
              courseCode: true,
              courseTitle: true,
              lecturer: { include: { user: { select: { id: true, fullName: true } } } },
            },
          },
        },
      },
    },
  });

  if (!student) return [];

  return student.courseStudents.map(({ course }) => ({
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    lecturerUserId: course.lecturer?.user.id ?? null,
    lecturerName: course.lecturer?.user.fullName ?? null,
    threadKey: courseThreadKey(course.id),
  }));
}

export async function listLecturerCourseRooms(lecturerUserId: string) {
  const lecturer = await prisma.lecturer.findFirst({
    where: { userId: lecturerUserId },
    include: {
      courses: {
        select: { id: true, courseCode: true, courseTitle: true },
      },
    },
  });

  if (!lecturer) return [];

  return lecturer.courses.map((course) => ({
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    threadKey: courseThreadKey(course.id),
  }));
}

export async function listAdminCourseRooms() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      courseCode: true,
      courseTitle: true,
      lecturer: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: { courseCode: "asc" },
  });

  return courses.map((course) => ({
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    lecturerName: course.lecturer?.user.fullName ?? null,
    threadKey: courseThreadKey(course.id),
  }));
}
