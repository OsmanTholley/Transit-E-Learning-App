import { prisma } from "@/lib/prisma";

export async function getLecturerCourseOrThrow(lecturerId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, lecturerId },
    select: { id: true, courseCode: true, courseTitle: true },
  });
  return course;
}

export async function listLecturerCourseOptions(lecturerId: string) {
  return prisma.course.findMany({
    where: { lecturerId },
    orderBy: { courseTitle: "asc" },
    select: { id: true, courseCode: true, courseTitle: true },
  });
}
