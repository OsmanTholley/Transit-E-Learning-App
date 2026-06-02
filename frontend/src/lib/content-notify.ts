import { prisma } from "@/lib/prisma";
import { notifyEnrolledStudents } from "@/lib/notify-course-students";

async function notifyAllAdmins(title: string, message: string) {
  const admins = await prisma.admin.findMany({
    select: { userId: true },
  });
  if (admins.length === 0) return 0;

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.userId,
      title,
      message,
    })),
  });
  return admins.length;
}

/** Notify enrolled students and all admins when new course material or video is published. */
export async function notifyContentPublished(
  courseId: string,
  courseLabel: string,
  contentTitle: string,
  kind: "material" | "video",
  extraMessage?: string
) {
  const kindLabel = kind === "video" ? "Video lesson" : "Course material";
  const title = `New ${kindLabel}: ${contentTitle}`;
  const message =
    extraMessage ??
    `${kindLabel} "${contentTitle}" was published for ${courseLabel}. Open your courses to view it.`;

  const [students, admins] = await Promise.all([
    notifyEnrolledStudents(courseId, title, message),
    notifyAllAdmins(title, message),
  ]);

  return { students, admins };
}
