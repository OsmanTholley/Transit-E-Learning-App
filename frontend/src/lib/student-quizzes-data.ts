import { getAccessibleCourseIdsForStudent } from "@/lib/student-courses-data";
import { prisma } from "@/lib/prisma";
import type {
  QuizQuestionView,
  QuizStatus,
  QuizSubmitAnswer,
  QuizSubmitResult,
  StudentQuizDetail,
  StudentQuizSummary,
} from "@/types/student-quizzes";

const PASSING_PERCENT = 50;
const ATTEMPT_LIMIT = 1;
const UPCOMING_DAYS = 14;

async function getEnrolledStudent(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      courseStudents: { select: { courseId: true } },
      quizAttempts: { select: { id: true, quizId: true, score: true, submittedAt: true } },
      department: { select: { departmentName: true } },
      program: { select: { programName: true } },
    },
  });
}

async function getStudentCourseIds(
  student: NonNullable<Awaited<ReturnType<typeof getEnrolledStudent>>>
) {
  return getAccessibleCourseIdsForStudent(student.id, student);
}

function inferQuestionType(q: {
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  question: string;
}): QuizQuestionView["type"] {
  const text = q.question.toLowerCase();
  if (text.includes("[image]") || text.includes("<img")) return "image";
  if (!q.optionC && !q.optionD && q.optionA && q.optionB) {
    const a = q.optionA.toLowerCase();
    const b = q.optionB.toLowerCase();
    if ((a === "true" || a === "false") && (b === "true" || b === "false")) return "true-false";
  }
  if (!q.optionA && !q.optionB) {
    if (text.includes("____") || text.includes("fill in")) return "fill-blank";
    return "short-answer";
  }
  return "multiple-choice";
}

function mapQuestion(q: {
  id: string;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  marks: number;
}): QuizQuestionView {
  const type = inferQuestionType(q);
  const options: { key: string; label: string }[] = [];
  if (type === "multiple-choice" || type === "true-false" || type === "image") {
    if (q.optionA) options.push({ key: "A", label: q.optionA });
    if (q.optionB) options.push({ key: "B", label: q.optionB });
    if (q.optionC) options.push({ key: "C", label: q.optionC });
    if (q.optionD) options.push({ key: "D", label: q.optionD });
  }
  return { id: q.id, question: q.question, type, options, marks: q.marks };
}

function deriveStatus(
  quiz: { id: string; createdAt: Date; _count: { questions: number } },
  attempts: { quizId: string }[],
  inProgressIds: Set<string>
): QuizStatus {
  const attempted = attempts.some((a) => a.quizId === quiz.id);
  if (attempted) return "completed";
  if (inProgressIds.has(quiz.id)) return "in-progress";
  const daysSince = (Date.now() - quiz.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= UPCOMING_DAYS && quiz._count.questions > 0) return "upcoming";
  if (quiz._count.questions > 0) return "active";
  return "upcoming";
}

function formatDueDate(createdAt: Date, durationMinutes: number | null) {
  const due = new Date(createdAt);
  due.setDate(due.getDate() + 30);
  if (durationMinutes) due.setMinutes(due.getMinutes() + durationMinutes);
  return due.toISOString();
}

export async function listQuizzesForStudent(
  userId: string,
  inProgressIds: string[] = []
): Promise<StudentQuizSummary[]> {
  const student = await getEnrolledStudent(userId);
  if (!student) return [];

  const courseIds = await getStudentCourseIds(student);
  if (!courseIds.length) return [];

  const inProgressSet = new Set(inProgressIds);

  const quizzes = await prisma.quiz.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: { select: { id: true, courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { fullName: true } } } },
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return quizzes.map((q) => {
    const attempts = student.quizAttempts.filter((a) => a.quizId === q.id);
    const best = attempts.reduce<number | null>((max, a) => {
      if (a.score == null) return max;
      return max == null ? a.score : Math.max(max, a.score);
    }, null);
    const last = attempts.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

    return {
      id: q.id,
      title: q.title ?? "Course Quiz",
      courseId: q.courseId,
      courseCode: q.course.courseCode,
      courseTitle: q.course.courseTitle,
      lecturerName: q.lecturer?.user.fullName ?? "Lecturer",
      durationMinutes: q.durationMinutes,
      totalMarks: q.totalMarks,
      questionCount: q._count.questions,
      instructions: q.instructions,
      createdAt: q.createdAt.toISOString(),
      status: deriveStatus(q, student.quizAttempts, inProgressSet),
      dueDate: formatDueDate(q.createdAt, q.durationMinutes),
      bestScore: best,
      attemptCount: attempts.length,
      lastAttemptAt: last?.submittedAt.toISOString() ?? null,
      passingScore: PASSING_PERCENT,
      attemptLimit: ATTEMPT_LIMIT,
    };
  });
}

export async function getQuizDetailForStudent(
  userId: string,
  quizId: string,
  includeAnswers = false
): Promise<StudentQuizDetail | null> {
  const student = await getEnrolledStudent(userId);
  if (!student) return null;

  const courseIds = await getStudentCourseIds(student);

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, courseId: { in: courseIds } },
    include: {
      course: { select: { id: true, courseCode: true, courseTitle: true } },
      lecturer: { include: { user: { select: { fullName: true } } } },
      questions: { orderBy: { id: "asc" } },
      _count: { select: { questions: true } },
    },
  });

  if (!quiz) return null;

  const attempts = student.quizAttempts.filter((a) => a.quizId === quiz.id);
  const best = attempts.reduce<number | null>((max, a) => {
    if (a.score == null) return max;
    return max == null ? a.score : Math.max(max, a.score);
  }, null);
  const last = attempts.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

  const questions = quiz.questions.map((q) => {
    const mapped = mapQuestion(q);
    if (!includeAnswers) return mapped;
    return mapped;
  });

  return {
    id: quiz.id,
    title: quiz.title ?? "Course Quiz",
    courseId: quiz.courseId,
    courseCode: quiz.course.courseCode,
    courseTitle: quiz.course.courseTitle,
    lecturerName: quiz.lecturer?.user.fullName ?? "Lecturer",
    durationMinutes: quiz.durationMinutes,
    totalMarks: quiz.totalMarks,
    questionCount: quiz._count.questions,
    instructions: quiz.instructions,
    createdAt: quiz.createdAt.toISOString(),
    status: deriveStatus(quiz, student.quizAttempts, new Set()),
    dueDate: formatDueDate(quiz.createdAt, quiz.durationMinutes),
    bestScore: best,
    attemptCount: attempts.length,
    lastAttemptAt: last?.submittedAt.toISOString() ?? null,
    passingScore: PASSING_PERCENT,
    attemptLimit: ATTEMPT_LIMIT,
    questions,
  };
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function gradeAnswer(
  correct: string | null,
  studentAnswer: string,
  options: { key: string; label: string }[]
): boolean {
  if (!correct) return false;
  const norm = normalizeAnswer(studentAnswer);
  const correctNorm = normalizeAnswer(correct);
  if (norm === correctNorm) return true;
  const byKey = options.find((o) => o.key.toUpperCase() === correct.toUpperCase());
  if (byKey && normalizeAnswer(byKey.label) === norm) return true;
  if (studentAnswer.toUpperCase() === correct.toUpperCase()) return true;
  return false;
}

export async function submitQuizAttempt(
  userId: string,
  quizId: string,
  answers: QuizSubmitAnswer[],
  timeUsedSeconds: number,
  practiceMode = false
): Promise<QuizSubmitResult | { error: string; status: number }> {
  const student = await getEnrolledStudent(userId);
  if (!student) return { error: "Unauthorized.", status: 401 };

  const courseIds = await getStudentCourseIds(student);

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, courseId: { in: courseIds } },
    include: { questions: true },
  });

  if (!quiz) return { error: "Quiz not found.", status: 404 };

  if (!practiceMode) {
    const existing = student.quizAttempts.filter((a) => a.quizId === quizId);
    if (existing.length >= ATTEMPT_LIMIT) {
      return { error: "Attempt limit reached for this quiz.", status: 403 };
    }
  }

  const totalMarks = quiz.totalMarks ?? quiz.questions.reduce((s, q) => s + q.marks, 0);
  let earned = 0;

  const breakdown = quiz.questions.map((q) => {
    const mapped = mapQuestion(q);
    const studentAnswer = answers.find((a) => a.questionId === q.id)?.answer ?? "";
    const correct = gradeAnswer(q.correctAnswer, studentAnswer, mapped.options);
    const points = correct ? q.marks : 0;
    earned += points;
    return {
      questionId: q.id,
      correct,
      studentAnswer,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      earned: points,
    };
  });

  const percentage = totalMarks > 0 ? Math.round((earned / totalMarks) * 100) : 0;
  const passed = percentage >= PASSING_PERCENT;

  let attemptId = `practice-${Date.now()}`;

  if (!practiceMode) {
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: student.id,
        score: percentage,
      },
    });
    attemptId = attempt.id;
  }

  return {
    attemptId,
    score: earned,
    totalMarks,
    percentage,
    passed,
    timeUsedSeconds,
    breakdown,
  };
}

export async function getLeaderboardForStudent(userId: string) {
  const student = await getEnrolledStudent(userId);
  if (!student) return [];

  const courseIds = await getStudentCourseIds(student);
  if (!courseIds.length) return [];

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quiz: { courseId: { in: courseIds } },
      score: { not: null },
    },
    include: {
      student: { include: { user: { select: { fullName: true } } } },
      quiz: {
        include: { course: { select: { courseCode: true } } },
      },
    },
    orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
    take: 50,
  });

  return attempts.map((a, i) => ({
    rank: i + 1,
    studentName: a.student?.user.fullName ?? "Student",
    courseCode: a.quiz.course.courseCode,
    quizTitle: a.quiz.title ?? "Quiz",
    score: a.score ?? 0,
    submittedAt: a.submittedAt.toISOString(),
  }));
}
