import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Prisma delegate after `npx prisma generate` + migrate */
const lecturerBroadcasts = (prisma as unknown as {
  lecturerMessageBroadcast: {
    create: (args: { data: Record<string, unknown> }) => Promise<{
      id: string;
      title: string;
      message: string;
      audienceType: string;
      audienceLabel: string;
      recipientCount: number;
      createdAt: Date;
    }>;
    findMany: (args: { orderBy: { createdAt: "desc" }; take: number }) => Promise<
      {
        id: string;
        title: string;
        audienceType: string;
        audienceLabel: string;
        recipientCount: number;
        createdAt: Date;
      }[]
    >;
  };
}).lecturerMessageBroadcast;

export type LecturerMessageAudienceType = "individual" | "department" | "all";

export type SendLecturerMessageInput = {
  title: string;
  message: string;
  audienceType: LecturerMessageAudienceType;
  targetId?: string | null;
  sentByUserId?: string | null;
};

function buildAudienceLabel(
  audienceType: LecturerMessageAudienceType,
  departmentName?: string,
  lecturerLabel?: string,
): string {
  switch (audienceType) {
    case "individual":
      return lecturerLabel ?? "Individual lecturer";
    case "department":
      return departmentName ?? "Department";
    case "all":
      return "All lecturers";
    default:
      return "Lecturers";
  }
}

const activeLecturerWhere: Prisma.LecturerWhereInput = {
  user: { isActive: true },
};

export async function resolveLecturerRecipients(
  input: Pick<SendLecturerMessageInput, "audienceType" | "targetId">,
): Promise<{ error: string } | { userIds: string[]; audienceLabel: string }> {
  if (input.audienceType === "all") {
    const lecturers = await prisma.lecturer.findMany({
      where: activeLecturerWhere,
      select: { userId: true },
    });
    const userIds = lecturers.map((l) => l.userId);
    if (userIds.length === 0) {
      return { error: "No active lecturers found." };
    }
    return { userIds, audienceLabel: buildAudienceLabel("all") };
  }

  if (input.audienceType === "individual") {
    const targetId = input.targetId?.trim();
    if (!targetId) {
      return { error: "Select a lecturer." };
    }
    const lecturer = await prisma.lecturer.findFirst({
      where: {
        id: targetId,
        ...activeLecturerWhere,
      },
      select: {
        userId: true,
        user: { select: { fullName: true, email: true } },
      },
    });
    if (!lecturer) {
      return { error: "Lecturer not found or inactive." };
    }
    const label = lecturer.user.email
      ? `${lecturer.user.fullName} (${lecturer.user.email})`
      : lecturer.user.fullName;
    return {
      userIds: [lecturer.userId],
      audienceLabel: buildAudienceLabel("individual", undefined, label),
    };
  }

  if (input.audienceType === "department") {
    const departmentId = input.targetId?.trim();
    if (!departmentId) {
      return { error: "Select a department." };
    }
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, departmentName: true },
    });
    if (!department) {
      return { error: "Department not found." };
    }
    const lecturers = await prisma.lecturer.findMany({
      where: {
        ...activeLecturerWhere,
        courses: { some: { departmentId: department.id } },
      },
      select: { userId: true },
    });
    const userIds = [...new Set(lecturers.map((l) => l.userId))];
    if (userIds.length === 0) {
      return { error: `No active lecturers assigned to courses in ${department.departmentName}.` };
    }
    return {
      userIds,
      audienceLabel: buildAudienceLabel("department", department.departmentName),
    };
  }

  return { error: "Invalid audience type." };
}

export async function sendLecturerMessage(input: SendLecturerMessageInput) {
  const title = input.title?.trim();
  const message = input.message?.trim();

  if (!title) return { error: "Title is required." as const };
  if (!message) return { error: "Message is required." as const };

  const recipients = await resolveLecturerRecipients(input);
  if ("error" in recipients) return recipients;

  const { userIds, audienceLabel } = recipients;

  const broadcast = await prisma.$transaction(async (tx) => {
    const record = await (
      tx as unknown as { lecturerMessageBroadcast: { create: typeof lecturerBroadcasts.create } }
    ).lecturerMessageBroadcast.create({
      data: {
        title,
        message,
        audienceType: input.audienceType,
        audienceLabel,
        recipientCount: userIds.length,
        sentByUserId: input.sentByUserId ?? null,
      },
    });

    await tx.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        targetUrl: "/lecturer/notifications",
        isRead: false,
      })),
    });

    return record;
  });

  return {
    broadcast: {
      id: broadcast.id,
      title: broadcast.title,
      audience: `${formatAudienceType(broadcast.audienceType)}: ${broadcast.audienceLabel}`,
      recipientCount: broadcast.recipientCount,
      sentAt: broadcast.createdAt.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Sent" as const,
    },
    recipientCount: userIds.length,
  };
}

function formatAudienceType(type: string): string {
  switch (type) {
    case "individual":
      return "Individual";
    case "department":
      return "Department";
    case "all":
      return "All lecturers";
    default:
      return type;
  }
}

export async function listLecturerMessageBroadcasts(limit = 50) {
  const rows = await lecturerBroadcasts.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row: (typeof rows)[number]) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    audience: `${formatAudienceType(row.audienceType)}: ${row.audienceLabel}`,
    recipientCount: row.recipientCount,
    sentAt: row.createdAt.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "Sent" as const,
  }));
}
