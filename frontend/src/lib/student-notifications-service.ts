import { prisma } from "@/lib/prisma";

/** Viewed notices are removed from the table this long after being read. */
export const NOTIFICATION_READ_TTL_MS = 24 * 60 * 60 * 1000;

function readExpiryCutoff() {
  return new Date(Date.now() - NOTIFICATION_READ_TTL_MS);
}

/** Deletes notifications that were read more than 24 hours ago. */
export async function purgeExpiredReadNotifications(userId: string) {
  const cutoff = readExpiryCutoff();
  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      readAt: { not: null, lt: cutoff },
    },
  });
  return result.count;
}

export async function listActiveNotifications(userId: string) {
  await purgeExpiredReadNotifications(userId);

  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      message: true,
      isRead: true,
      readAt: true,
      createdAt: true,
    },
  });

  return rows.map((n) => ({
    id: n.id,
    title: n.title ?? "Notice",
    message: n.message ?? "",
    isRead: n.isRead,
    readAt: n.readAt?.toISOString() ?? null,
    sentAt: n.createdAt.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    expiresAt:
      n.readAt != null
        ? new Date(n.readAt.getTime() + NOTIFICATION_READ_TTL_MS).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
  }));
}

export async function countUnreadNotifications(userId: string) {
  await purgeExpiredReadNotifications(userId);
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationRead(userId: string, id: string) {
  const now = new Date();
  const updated = await prisma.notification.updateMany({
    where: { id, userId, isRead: false },
    data: { isRead: true, readAt: now },
  });
  return updated.count > 0;
}

export async function markAllNotificationsRead(userId: string) {
  const now = new Date();
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: now },
  });
  return result.count;
}
