import { prisma } from "@/lib/prisma";

export async function notifyEnrolledStudents(
  courseId: string,
  title: string,
  message: string
) {
  const enrollments = await prisma.courseStudent.findMany({
    where: { courseId },
    include: { student: { select: { userId: true } } },
  });
  if (enrollments.length === 0) return 0;

  await prisma.notification.createMany({
    data: enrollments.map((e) => ({
      userId: e.student.userId,
      title,
      message,
    })),
  });
  return enrollments.length;
}
