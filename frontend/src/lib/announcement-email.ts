import { sendAnnouncementEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { isAnnouncementEmailAlertsEnabled } from "@/lib/system-settings";

export async function sendAnnouncementEmails(params: {
  userIds: string[];
  title: string;
  message: string;
  portalLabel: string;
}) {
  if (params.userIds.length === 0) return;

  const enabled = await isAnnouncementEmailAlertsEnabled();
  if (!enabled) return;

  const users = await prisma.user.findMany({
    where: {
      id: { in: params.userIds },
      isActive: true,
      email: { not: null },
    },
    select: { email: true, fullName: true },
  });

  await Promise.allSettled(
    users
      .filter((user): user is { email: string; fullName: string } => Boolean(user.email))
      .map((user) =>
        sendAnnouncementEmail({
          to: user.email,
          fullName: user.fullName,
          title: params.title,
          message: params.message,
          portalLabel: params.portalLabel,
        }),
      ),
  );
}
