import { prisma } from "@/lib/prisma";
import { notifyCourseStudents } from "@/lib/notify-course-students";

export type ContentKind = "material" | "video" | "quiz" | "assignment" | "discussion";

async function notifyAllAdmins(title: string, message: string, targetUrl: string) {
  const admins = await prisma.admin.findMany({
    select: { userId: true },
  });
  if (admins.length === 0) return 0;

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.userId,
      title,
      message,
      targetUrl,
    })),
  });
  return admins.length;
}

const KIND_LABELS: Record<ContentKind, string> = {
  material: "Course material",
  video: "Video lesson",
  quiz: "Quiz",
  assignment: "Assignment",
  discussion: "Discussion",
};

const STUDENT_TARGETS: Record<ContentKind, (courseId: string) => string> = {
  material: (courseId) => `/student/courses/${courseId}`,
  video: (courseId) => `/student/video-lessons`,
  quiz: (courseId) => `/student/quizzes`,
  assignment: (courseId) => `/student/assignments`,
  discussion: (courseId) => `/student/discussions`,
};

const ADMIN_TARGETS: Record<ContentKind, string> = {
  material: "/admin/content/lecture-notes",
  video: "/admin/content/videos",
  quiz: "/admin/content/quizzes",
  assignment: "/admin/content/assignments",
  discussion: "/admin/content/discussions",
};

/** Notify students and admins when new course content is published. */
export async function notifyContentPublished(
  courseId: string,
  courseLabel: string,
  contentTitle: string,
  kind: ContentKind,
  extraMessage?: string
) {
  const kindLabel = KIND_LABELS[kind];
  const title = `New ${kindLabel}: ${contentTitle}`;
  const message =
    extraMessage ??
    `${kindLabel} "${contentTitle}" was published for ${courseLabel}. Open your courses to view it.`;

  const studentTarget = STUDENT_TARGETS[kind](courseId);
  const adminTarget = ADMIN_TARGETS[kind];

  const [students, admins] = await Promise.all([
    notifyCourseStudents(courseId, title, message, studentTarget),
    notifyAllAdmins(title, message, adminTarget),
  ]);

  return { students, admins };
}
