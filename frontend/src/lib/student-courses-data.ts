import { prisma } from "@/lib/prisma";
import {
  courseMatchesStudentProfile,
  formatDisplayDate,
  mapCourseCard,
  computeCourseStats,
} from "@/lib/student-courses-service";
import { semestersMatch } from "@/lib/academic-semesters";
import { purgeExpiredVideos } from "@/lib/video-expiry";
import type {
  AssignmentItem,
  CourseDetail,
  DiscussionItem,
  LectureNoteItem,
  QuizItem,
  VideoItem,
} from "@/types/student-courses";

const courseInclude = {
  department: true,
  program: true,
  lecturer: { include: { user: { select: { fullName: true } } } },
  assignments: { select: { id: true, dueDate: true, title: true, instructions: true } },
  quizzes: { select: { id: true, title: true, durationMinutes: true, totalMarks: true, _count: { select: { questions: true } } } },
  lectureNotes: {
    select: {
      id: true,
      title: true,
      fileUrl: true,
      fileType: true,
      description: true,
      coverImageUrl: true,
      createdAt: true,
      lecturer: { include: { user: { select: { fullName: true } } } },
    },
  },
  videos: {
    select: {
      id: true,
      title: true,
      videoUrl: true,
      thumbnailUrl: true,
      duration: true,
      expiresAt: true,
      deletionNotice: true,
    },
  },
  discussions: {
    select: {
      id: true,
      title: true,
      message: true,
      discussionType: true,
      createdAt: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
} as const;

export async function getEnrolledCoursesForStudent(studentId: string) {
  const enrollments = await prisma.courseStudent.findMany({
    where: { studentId },
    include: {
      course: { include: courseInclude },
    },
    orderBy: { enrolledAt: "desc" },
  });
  return enrollments.map((e) => e.course);
}

type StudentCourseProfile = {
  departmentId: string | null;
  programId: string | null;
  level: string | null;
  semester: string | null;
};

/** Enrolled courses plus profile-matched courses from the catalog. */
export async function getAccessibleCoursesForStudent(studentId: string, student: StudentCourseProfile) {
  const enrolled = await getEnrolledCoursesForStudent(studentId);
  const byId = new Map(enrolled.map((course) => [course.id, course]));

  const where: { departmentId?: string; programId?: string } = {};
  if (student.departmentId) where.departmentId = student.departmentId;
  if (student.programId) where.programId = student.programId;

  if (Object.keys(where).length > 0) {
    const catalog = await prisma.course.findMany({
      where,
      include: courseInclude,
      orderBy: { courseTitle: "asc" },
    });

    for (const course of catalog) {
      if (courseMatchesStudentProfile(course, student)) {
        byId.set(course.id, course);
      }
    }
  }

  return [...byId.values()];
}

export function buildCoursesPayload(
  student: NonNullable<Awaited<ReturnType<typeof import("@/lib/student-auth").requireStudent>>>,
  courses: Awaited<ReturnType<typeof getEnrolledCoursesForStudent>>,
  filter?: string
) {
  const matched = courses.filter((c) => courseMatchesStudentProfile(c, student));
  const cards = matched.map((course, index) => ({
    ...mapCourseCard(course, index, student.submissions, student.quizAttempts),
    isCurrentSemester: semestersMatch(course.semester, student.semester),
  }));

  let filtered = cards;
  if (filter === "completed") {
    filtered = cards.filter((c) => c.completed);
  } else if (filter === "current-semester") {
    filtered = cards.filter((c) => semestersMatch(c.semester, student.semester) && !c.completed);
  }

  const submittedIds = new Set(student.submissions.map((s) => s.assignmentId));
  const now = new Date();
  const pendingAssignments = matched.reduce((count, course) => {
    return (
      count +
      course.assignments.filter((a) => !submittedIds.has(a.id) && (!a.dueDate || a.dueDate >= now)).length
    );
  }, 0);

  const scored = student.quizAttempts.filter((a) => a.score != null);
  const quizAverage =
    scored.length > 0
      ? Math.round(scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length)
      : 0;

  return {
    courses: filtered,
    stats: computeCourseStats(cards, pendingAssignments, quizAverage),
    profile: {
      semester: student.semester,
      level: student.level,
      department: student.department?.departmentName ?? "—",
      program: student.program?.programName ?? "—",
    },
  };
}

function assignmentStatus(
  assignmentId: string,
  dueDate: Date | null,
  submissions: { assignmentId: string; grade: string | null; feedback: string | null; submittedAt: Date }[]
): AssignmentItem["status"] {
  const sub = submissions.find((s) => s.assignmentId === assignmentId);
  if (sub) return "submitted";
  if (dueDate && dueDate < new Date()) return "late";
  return "pending";
}

export function buildCourseDetail(
  student: NonNullable<Awaited<ReturnType<typeof import("@/lib/student-auth").requireStudent>>>,
  course: Awaited<ReturnType<typeof getEnrolledCoursesForStudent>>[number],
  index: number
): CourseDetail {
  const card = mapCourseCard(course, index, student.submissions, student.quizAttempts);
  const submittedIds = new Set(student.submissions.map((s) => s.assignmentId));
  const attemptedQuizIds = new Map(
    student.quizAttempts.map((a) => [a.quizId, a.score])
  );

  const lectureNotes: LectureNoteItem[] = course.lectureNotes.map((n) => ({
    id: n.id,
    title: n.title,
    courseId: course.id,
    courseTitle: course.courseTitle,
    courseCode: course.courseCode,
    lecturerName: n.lecturer?.user.fullName ?? card.lecturerName,
    fileType: (n.fileType ?? "PDF").toUpperCase(),
    fileUrl: n.fileUrl,
    description: n.description,
    coverImageUrl: n.coverImageUrl,
    uploadedAt: formatDisplayDate(n.createdAt),
  }));

  const now = new Date();
  const videos: VideoItem[] = course.videos
    .filter((v) => !v.expiresAt || v.expiresAt > now)
    .map((v, i) => ({
      id: v.id,
      title: v.title ?? `Lesson ${i + 1}`,
      courseId: course.id,
      courseTitle: course.courseTitle,
      courseCode: course.courseCode,
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      expiresAt: v.expiresAt?.toISOString() ?? null,
      deletionNotice: v.deletionNotice,
      progress: i === 0 ? 45 : 0,
    }));

  const assignments: AssignmentItem[] = course.assignments.map((a) => {
    const sub = student.submissions.find((s) => s.assignmentId === a.id);
    return {
      id: a.id,
      title: a.title ?? "Untitled Assignment",
      courseId: course.id,
      courseTitle: course.courseTitle,
      courseCode: course.courseCode,
      instructions: a.instructions,
      dueDate: a.dueDate ? formatDisplayDate(a.dueDate) : null,
      status: assignmentStatus(a.id, a.dueDate, student.submissions),
      marks: sub?.grade ?? null,
      feedback: sub?.feedback ?? null,
      submittedAt: sub?.submittedAt ? formatDisplayDate(sub.submittedAt) : null,
    };
  });

  const quizzes: QuizItem[] = course.quizzes.map((q) => ({
    id: q.id,
    title: q.title ?? "Course Quiz",
    courseId: course.id,
    courseTitle: course.courseTitle,
    courseCode: course.courseCode,
    durationMinutes: q.durationMinutes,
    totalMarks: q.totalMarks,
    questionCount: q._count.questions,
    bestScore: attemptedQuizIds.get(q.id) ?? null,
    attempted: attemptedQuizIds.has(q.id),
  }));

  const discussions: DiscussionItem[] = course.discussions.map((d) => ({
    id: d.id,
    title: d.title ?? "Discussion",
    message: d.message ?? "",
    courseTitle: course.courseTitle,
    authorName: student.user.fullName,
    type: d.discussionType,
    createdAt: formatDisplayDate(d.createdAt),
    commentCount: d._count.comments,
  }));

  const lessonsTotal = course.lectureNotes.length + course.videos.length;
  const lessonsCompleted = Math.round((lessonsTotal * card.progress) / 100);
  const assignmentsCompleted = course.assignments.filter((a) => submittedIds.has(a.id)).length;
  const quizzesCompleted = course.quizzes.filter((q) => attemptedQuizIds.has(q.id)).length;

  return {
    ...card,
    syllabusText: course.syllabusText,
    syllabusUrl: course.syllabusUrl,
    objectives: [
      `Master core concepts in ${course.courseTitle}`,
      "Apply knowledge through assignments and quizzes",
      "Participate in course discussions and collaborative learning",
    ],
    announcements: [
      {
        id: "welcome",
        title: "Welcome to the course",
        message: `Welcome to ${course.courseTitle}. Check lecture notes and assignments regularly.`,
        createdAt: formatDisplayDate(new Date()),
      },
    ],
    lectureNotes,
    videos,
    assignments,
    quizzes,
    discussions,
    progressBreakdown: {
      lessonsCompleted,
      lessonsTotal,
      assignmentsCompleted,
      assignmentsTotal: course.assignments.length,
      quizzesCompleted,
      quizzesTotal: course.quizzes.length,
    },
  };
}

export async function getMaterialsForStudent(
  student: NonNullable<Awaited<ReturnType<typeof import("@/lib/student-auth").requireStudent>>>,
  type: string
) {
  if (type === "videos") {
    await purgeExpiredVideos();
  }
  const courses = (await getAccessibleCoursesForStudent(student.id, student)).filter((c) =>
    courseMatchesStudentProfile(c, student)
  );

  if (type === "lecture-notes") {
    return courses.flatMap((course) =>
      course.lectureNotes.map((n) => ({
        id: n.id,
        title: n.title,
        courseId: course.id,
        courseTitle: course.courseTitle,
        courseCode: course.courseCode,
        lecturerName: n.lecturer?.user.fullName ?? "Lecturer",
        fileType: (n.fileType ?? "PDF").toUpperCase(),
        fileUrl: n.fileUrl,
        description: n.description,
        coverImageUrl: n.coverImageUrl,
        uploadedAt: formatDisplayDate(n.createdAt),
      }))
    );
  }

  if (type === "videos") {
    const now = new Date();
    return courses.flatMap((course, courseIndex) =>
      course.videos
        .filter((v) => !v.expiresAt || v.expiresAt > now)
        .map((v, i) => ({
          id: v.id,
          title: v.title ?? `Lesson ${i + 1}`,
          courseId: course.id,
          courseTitle: course.courseTitle,
          courseCode: course.courseCode,
          videoUrl: v.videoUrl,
          thumbnailUrl: v.thumbnailUrl,
          duration: v.duration,
          expiresAt: v.expiresAt?.toISOString() ?? null,
          deletionNotice: v.deletionNotice,
          progress: courseIndex === 0 && i === 0 ? 45 : 0,
        }))
    );
  }

  if (type === "assignments") {
    return courses.flatMap((course) =>
      course.assignments.map((a) => {
        const sub = student.submissions.find((s) => s.assignmentId === a.id);
        return {
          id: a.id,
          title: a.title ?? "Untitled Assignment",
          courseId: course.id,
          courseTitle: course.courseTitle,
          courseCode: course.courseCode,
          instructions: a.instructions,
          dueDate: a.dueDate ? formatDisplayDate(a.dueDate) : null,
          status: assignmentStatus(a.id, a.dueDate, student.submissions),
          marks: sub?.grade ?? null,
          feedback: sub?.feedback ?? null,
          submittedAt: sub?.submittedAt ? formatDisplayDate(sub.submittedAt) : null,
        };
      })
    );
  }

  if (type === "quizzes") {
    return courses.flatMap((course) =>
      course.quizzes.map((q) => {
        const attempt = student.quizAttempts.find((a) => a.quizId === q.id);
        return {
          id: q.id,
          title: q.title ?? "Course Quiz",
          courseId: course.id,
          courseTitle: course.courseTitle,
          courseCode: course.courseCode,
          durationMinutes: q.durationMinutes,
          totalMarks: q.totalMarks,
          questionCount: q._count.questions,
          bestScore: attempt?.score ?? null,
          attempted: !!attempt,
        };
      })
    );
  }

  if (type === "discussions") {
    const rows = await prisma.discussion.findMany({
      where: {
        OR: [
          { courseId: { in: courses.map((c) => c.id) } },
          { studentId: student.id },
        ],
      },
      include: {
        course: { select: { courseTitle: true } },
        student: { include: { user: { select: { fullName: true } } } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((d) => ({
      id: d.id,
      title: d.title ?? "Discussion",
      message: d.message ?? "",
      courseTitle: d.course?.courseTitle ?? null,
      authorName: d.student?.user.fullName ?? "Student",
      type: d.discussionType,
      createdAt: formatDisplayDate(d.createdAt),
      commentCount: d._count.comments,
    }));
  }

  return [];
}
