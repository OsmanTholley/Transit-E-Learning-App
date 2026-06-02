import { prisma } from "@/lib/prisma";

export const VIDEO_RETENTION_DAYS = 7;

export function getVideoExpiryDate(from = new Date()) {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + VIDEO_RETENTION_DAYS);
  return expires;
}

export function defaultVideoDeletionNotice(expiresAt: Date) {
  const dateLabel = expiresAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `This video will be removed on ${dateLabel}. Please download a copy before that date if you need it offline.`;
}

/** Remove videos past their expiry (called on read paths). */
export async function purgeExpiredVideos() {
  const now = new Date();
  const expired = await prisma.video.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true },
  });
  if (expired.length === 0) return 0;

  await prisma.video.deleteMany({
    where: { id: { in: expired.map((v) => v.id) } },
  });
  return expired.length;
}
