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
    where: {
      ...(course.departmentId ? { departmentId: course.departmentId } : {}),
      ...(course.programId ? { programId: course.programId } : {}),
    },
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

/** Remove enrollments that no longer match a student's department/program profile. */
export async function pruneStaleEnrollmentsForStudents(studentIds: string[]) {
  if (studentIds.length === 0) return 0;

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      departmentId: true,
      programId: true,
      level: true,
      semester: true,
      courseStudents: {
        select: {
          id: true,
          course: {
            select: {
              id: true,
              departmentId: true,
              programId: true,
              level: true,
              semester: true,
            },
          },
        },
      },
    },
  });

  const staleIds: string[] = [];
  for (const student of students) {
    for (const enrollment of student.courseStudents) {
      if (!courseMatchesStudentProfile(enrollment.course, student)) {
        staleIds.push(enrollment.id);
      }
    }
  }

  if (staleIds.length === 0) return 0;

  await prisma.courseStudent.deleteMany({ where: { id: { in: staleIds } } });
  return staleIds.length;
}

/** Re-sync enrollments for every course that matches updated student profiles. */
export async function syncEnrollmentsForStudents(studentIds: string[]) {
  if (studentIds.length === 0) return;

  await pruneStaleEnrollmentsForStudents(studentIds);

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

  const departmentIds = [...new Set(students.map((s) => s.departmentId).filter(Boolean))] as string[];
  const programIds = [...new Set(students.map((s) => s.programId).filter(Boolean))] as string[];

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        ...(departmentIds.length ? [{ departmentId: { in: departmentIds } }] : []),
        ...(programIds.length ? [{ programId: { in: programIds } }] : []),
      ],
    },
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
