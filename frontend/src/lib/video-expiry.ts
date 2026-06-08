import { prisma } from "@/lib/prisma";

/** Videos remain until admin or lecturer deletes them. Legacy rows may still have expiresAt set. */
export async function purgeExpiredVideos() {
  return 0;
}

/** @deprecated Videos no longer auto-expire. Returns null. */
export function getVideoExpiryDate(_from = new Date()): null {
  return null;
}

/** @deprecated Videos no longer auto-expire. */
export function defaultVideoDeletionNotice(_expiresAt?: Date | null): null {
  return null;
}

/** Clear legacy expiry metadata from videos that were scheduled for auto-removal. */
export async function clearLegacyVideoExpiry() {
  const now = new Date();
  const result = await prisma.video.updateMany({
    where: { expiresAt: { lt: now } },
    data: { expiresAt: null, deletionNotice: null },
  });
  return result.count;
}
