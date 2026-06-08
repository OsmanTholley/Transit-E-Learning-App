import { prisma } from "@/lib/prisma";

export async function getStudentsForLecturer(lecturerId: string, courseId?: string) {
  const enrollments = await prisma.courseStudent.findMany({
    where: {
      course: {
        lecturerId,
        ...(courseId ? { id: courseId } : {}),
      },
    },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, email: true } },
          department: { select: { departmentName: true } },
          program: { select: { programName: true } },
        },
      },
      course: {
        select: { courseCode: true, courseTitle: true },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.student.id,
    studentIdCode: enrollment.student.studentId,
    fullName: enrollment.student.user.fullName,
    email: enrollment.student.user.email ?? "—",
    course: `${enrollment.course.courseCode} – ${enrollment.course.courseTitle}`,
    department: enrollment.student.department?.departmentName ?? "—",
    program: enrollment.student.program?.programName ?? "—",
    enrolledAt: enrollment.enrolledAt.toISOString(),
  }));
}
