import { Prisma } from "@prisma/client";
import { academicYearDbVariants, normalizeAcademicYear } from "@/lib/academic-years";
import { prisma } from "@/lib/prisma";

export type MessageAudienceType = "individual" | "department" | "year" | "all";

export type SendStudentMessageInput = {
  title: string;
  message: string;
  audienceType: MessageAudienceType;
  targetId?: string | null;
  targetValue?: string | null;
  sentByUserId?: string | null;
};

function buildAudienceLabel(
  audienceType: MessageAudienceType,
  departmentName?: string,
  studentLabel?: string,
  year?: string,
): string {
  switch (audienceType) {
    case "individual":
      return studentLabel ?? "Individual student";
    case "department":
      return departmentName ?? "Department";
    case "year":
      return year ?? "Year";
    case "all":
      return "All students";
    default:
      return "Students";
  }
}

export async function resolveStudentRecipients(
  input: Pick<SendStudentMessageInput, "audienceType" | "targetId" | "targetValue">,
): Promise<
  | { error: string }
  | {
      userIds: string[];
      audienceLabel: string;
    }
> {
  const baseWhere: Prisma.StudentWhereInput = {
    user: { isActive: true },
  };

  if (input.audienceType === "all") {
    const students = await prisma.student.findMany({
      where: baseWhere,
      select: { userId: true },
    });
    const userIds = students.map((s) => s.userId);
    if (userIds.length === 0) {
      return { error: "No active students found." };
    }
    return { userIds, audienceLabel: buildAudienceLabel("all") };
  }

  if (input.audienceType === "individual") {
    const targetId = input.targetId?.trim();
    if (!targetId) {
      return { error: "Select a student." };
    }
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: targetId }, { studentId: targetId }],
        ...baseWhere,
      },
      select: {
        userId: true,
        studentId: true,
        user: { select: { fullName: true } },
      },
    });
    if (!student) {
      return { error: "Student not found or inactive." };
    }
    return {
      userIds: [student.userId],
      audienceLabel: buildAudienceLabel("individual", undefined, `${student.studentId} — ${student.user.fullName}`),
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
    const students = await prisma.student.findMany({
      where: { ...baseWhere, departmentId: department.id },
      select: { userId: true },
    });
    const userIds = students.map((s) => s.userId);
    if (userIds.length === 0) {
      return { error: `No active students in ${department.departmentName}.` };
    }
    return {
      userIds,
      audienceLabel: buildAudienceLabel("department", department.departmentName),
    };
  }

  if (input.audienceType === "year") {
    const year = normalizeAcademicYear(input.targetValue ?? input.targetId);
    if (!year) {
      return { error: "Select a year." };
    }
    const levelVariants = academicYearDbVariants(input.targetValue ?? input.targetId);
    const students = await prisma.student.findMany({
      where: {
        ...baseWhere,
        level: { in: levelVariants },
      },
      select: { userId: true },
    });
    const userIds = students.map((s) => s.userId);
    if (userIds.length === 0) {
      return { error: `No active students in ${year}.` };
    }
    return { userIds, audienceLabel: buildAudienceLabel("year", undefined, undefined, year) };
  }

  return { error: "Invalid audience type." };
}

export async function sendStudentMessage(input: SendStudentMessageInput) {
  const title = input.title?.trim();
  const message = input.message?.trim();

  if (!title) {
    return { error: "Title is required." as const };
  }
  if (!message) {
    return { error: "Message is required." as const };
  }

  const recipients = await resolveStudentRecipients(input);
  if ("error" in recipients) {
    return recipients;
  }

  const { userIds, audienceLabel } = recipients;

  const broadcast = await prisma.$transaction(async (tx) => {
    const record = await tx.studentMessageBroadcast.create({
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
        targetUrl: "/student/notifications",
        isRead: false,
      })),
    });

    return record;
  });

  return {
    broadcast: {
      id: broadcast.id,
      title: broadcast.title,
      message: broadcast.message,
      audience: `${formatAudienceType(broadcast.audienceType)}: ${broadcast.audienceLabel}`,
      audienceType: broadcast.audienceType,
      audienceLabel: broadcast.audienceLabel,
      recipientCount: broadcast.recipientCount,
      sentAt: broadcast.createdAt.toISOString(),
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
    case "year":
      return "Year";
    case "all":
      return "All students";
    default:
      return type;
  }
}

export async function listStudentMessageBroadcasts(limit = 50) {
  const rows = await prisma.studentMessageBroadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
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
