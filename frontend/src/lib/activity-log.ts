import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LogActivityInput = {
  actorId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logActivity(input: LogActivityInput) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        metadata: input.metadata ? (input.metadata as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error("logActivity:", error);
  }
}

export type ActivityLogFilters = {
  action?: string | null;
  limit?: number;
};

export async function listActivityLogs(limitOrFilters: number | ActivityLogFilters = 50) {
  const filters = typeof limitOrFilters === "number" ? { limit: limitOrFilters } : limitOrFilters;
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);

  const rows = await prisma.activityLog.findMany({
    where: filters.action ? { action: filters.action } : undefined,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { fullName: true, role: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
    metadata: row.metadata as Record<string, unknown> | null,
    actorName: row.actor?.fullName ?? "System",
    actorRole: row.actor?.role ?? "—",
    actorEmail: row.actor?.email ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countActivityLogsByAction() {
  const rows = await prisma.activityLog.groupBy({
    by: ["action"],
    _count: { action: true },
    orderBy: { _count: { action: "desc" } },
  });
  return rows.map((row) => ({ action: row.action, count: row._count.action }));
}

export async function clearActivityLogs() {
  await prisma.activityLog.deleteMany({});
}
