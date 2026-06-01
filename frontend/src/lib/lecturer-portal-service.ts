import { prisma } from "@/lib/prisma";
import { mapLecturerToRecord } from "@/lib/lecturer-mapper";
import { formatAcademicYear } from "@/lib/academic-years";
import type {
  LecturerAdminDetail,
  LecturerCoursesData,
  LecturerDashboardData,
} from "@/types/lecturer-portal";

export async function buildLecturerDashboardData(
  lecturerId: string
): Promise<LecturerDashboardData | null> {
  const lecturer = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    include: {
      user: { select: { fullName: true } },
      courses: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { courseStudents: true } },
        },
      },
      _count: {
        select: {
          lectureNotes: true,
          quizzes: true,
          assignments: true,
        },
      },
    },
  });

  if (!lecturer) return null;

  const courseIds = lecturer.courses.map((c) => c.id);

  const pendingGrading =
    courseIds.length === 0
      ? 0
      : await prisma.submission.count({
          where: {
            grade: null,
            assignment: { courseId: { in: courseIds } },
          },
        });

  return {
    lecturerName: lecturer.user.fullName,
    stats: {
      coursesManaged: lecturer.courses.length,
      pendingGrading,
      notesUploaded: lecturer._count.lectureNotes,
      quizzesCreated: lecturer._count.quizzes,
      assignmentsCount: lecturer._count.assignments,
    },
    recentCourses: lecturer.courses.slice(0, 5).map((course) => ({
      id: course.id,
      code: course.courseCode,
      title: course.courseTitle,
      students: course._count.courseStudents,
      updatedAt: course.createdAt.toISOString().slice(0, 10),
    })),
  };
}

export async function buildLecturerCoursesData(
  lecturerId: string
): Promise<LecturerCoursesData> {
  const courses = await prisma.course.findMany({
    where: { lecturerId },
    orderBy: { courseTitle: "asc" },
    include: {
      department: { select: { departmentName: true } },
      program: { select: { programName: true } },
      _count: { select: { courseStudents: true } },
    },
  });

  return {
    courses: courses.map((course) => ({
      id: course.id,
      code: course.courseCode,
      title: course.courseTitle,
      department: course.department?.departmentName ?? "—",
      program: course.program?.programName ?? "—",
      semester: course.semester ?? "—",
      level: formatAcademicYear(course.level) ?? "—",
      students: course._count.courseStudents,
      description: course.description,
      learningOutcomes:
        course.learningOutcomes
          ?.split("\n")
          .map((item) => item.trim())
          .filter(Boolean) ?? [],
      syllabusUrl: course.syllabusUrl,
      updatedAt: course.createdAt.toISOString().slice(0, 10),
    })),
  };
}

export async function buildLecturerAdminDetail(
  lecturerId: string
): Promise<LecturerAdminDetail | null> {
  const lecturer = await prisma.lecturer.findFirst({
    where: { id: lecturerId },
    include: {
      user: true,
      courses: {
        include: {
          department: { select: { departmentName: true } },
          _count: { select: { courseStudents: true } },
        },
      },
      lectureNotes: {
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { course: { select: { courseTitle: true } } },
      },
      _count: {
        select: {
          lectureNotes: true,
          videos: true,
          quizzes: true,
          assignments: true,
        },
      },
    },
  });

  if (!lecturer) return null;

  const courseIds = lecturer.courses.map((c) => c.id);

  const [totalSubmissions, gradedSubmissions, quizAttempts] = await Promise.all([
    courseIds.length
      ? prisma.submission.count({
          where: { assignment: { courseId: { in: courseIds } } },
        })
      : Promise.resolve(0),
    courseIds.length
      ? prisma.submission.count({
          where: {
            grade: { not: null },
            assignment: { courseId: { in: courseIds } },
          },
        })
      : Promise.resolve(0),
    courseIds.length
      ? prisma.quizAttempt.count({
          where: { quiz: { courseId: { in: courseIds } } },
        })
      : Promise.resolve(0),
  ]);

  const gradedPct =
    totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0;

  return {
    lecturer: mapLecturerToRecord(lecturer),
    courseList: lecturer.courses.map((c) => ({
      code: c.courseCode,
      title: c.courseTitle,
      students: c._count.courseStudents,
    })),
    materials: lecturer.lectureNotes.map((note) => ({
      title: note.title,
      course: note.course.courseTitle,
      type: "PDF",
    })),
    stats: {
      quizzesCreated: lecturer._count.quizzes,
      quizAttempts,
      assignmentsCount: lecturer._count.assignments,
      gradedSubmissions,
      totalSubmissions,
      lectureNotes: lecturer._count.lectureNotes,
      videos: lecturer._count.videos,
      gradedPct,
    },
  };
}
