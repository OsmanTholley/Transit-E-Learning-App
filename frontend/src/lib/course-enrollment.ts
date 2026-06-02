import { prisma } from "@/lib/prisma";
import { courseMatchesStudentProfile } from "@/lib/student-courses-service";

/** Enroll all students whose profile matches a course (dept, program, year, semester). */
export async function syncCourseEnrollments(courseId: string) {
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

  const students = await prisma.student.findMany({
    select: {
      id: true,
      departmentId: true,
      programId: true,
      level: true,
      semester: true,
    },
  });

  const matching = students.filter((s) => courseMatchesStudentProfile(course, s));
  if (matching.length === 0) return 0;

  await prisma.courseStudent.createMany({
    data: matching.map((s) => ({ courseId: course.id, studentId: s.id })),
    skipDuplicates: true,
  });

  return matching.length;
}

/** Re-sync enrollments for every course that matches updated student profiles. */
export async function syncEnrollmentsForStudents(studentIds: string[]) {
  if (studentIds.length === 0) return;

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      departmentId: true,
      programId: true,
      level: true,
      semester: true,
    },
  });

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      departmentId: true,
      programId: true,
      level: true,
      semester: true,
    },
  });

  const pairs: { courseId: string; studentId: string }[] = [];
  for (const course of courses) {
    for (const student of students) {
      if (courseMatchesStudentProfile(course, student)) {
        pairs.push({ courseId: course.id, studentId: student.id });
      }
    }
  }

  if (pairs.length === 0) return;

  await prisma.courseStudent.createMany({
    data: pairs,
    skipDuplicates: true,
  });
}
