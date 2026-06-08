import { prisma } from "@/lib/prisma";
import { courseMatchesStudentProfile } from "@/lib/student-courses-service";

/** Notify all students who can access a course (enrolled or profile-matched). */
export async function notifyCourseStudents(
  courseId: string,
  title: string,
  message: string,
  targetUrl?: string | null
) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      departmentId: true,
      programId: true,
      level: true,
      semester: true,
    },
  });
  if (!course) return 0;

  const [enrollments, profileStudents] = await Promise.all([
    prisma.courseStudent.findMany({
      where: { courseId },
      include: { student: { select: { userId: true } } },
    }),
    prisma.student.findMany({
      where: {
        ...(course.departmentId ? { departmentId: course.departmentId } : {}),
        ...(course.programId ? { programId: course.programId } : {}),
      },
      select: {
        userId: true,
        departmentId: true,
        programId: true,
        level: true,
        semester: true,
      },
    }),
  ]);

  const userIds = new Set<string>();
  for (const e of enrollments) {
    userIds.add(e.student.userId);
  }
  for (const s of profileStudents) {
    if (courseMatchesStudentProfile(course, s)) {
      userIds.add(s.userId);
    }
  }

  if (userIds.size === 0) return 0;

  const url = targetUrl ?? `/student/courses/${courseId}`;

  await prisma.notification.createMany({
    data: [...userIds].map((userId) => ({
      userId,
      title,
      message,
      targetUrl: url,
    })),
  });

  return userIds.size;
}

/** @deprecated Use notifyCourseStudents for broader reach. */
export async function notifyEnrolledStudents(
  courseId: string,
  title: string,
  message: string,
  targetUrl?: string | null
) {
  return notifyCourseStudents(courseId, title, message, targetUrl);
}
