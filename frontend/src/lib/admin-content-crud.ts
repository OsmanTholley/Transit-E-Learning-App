import type { DiscussionType } from "@prisma/client";
import type {
  AdminAssignmentCreate,
  AdminAssignmentDetail,
  AdminAssignmentUpdate,
  AdminContentDetail,
  AdminContentTarget,
  AdminContentUpdateBody,
  AdminDiscussionCreate,
  AdminDiscussionDetail,
  AdminDiscussionUpdate,
  AdminLectureNoteCreate,
  AdminLectureNoteDetail,
  AdminLectureNoteUpdate,
  AdminQuizCreate,
  AdminQuizDetail,
  AdminQuizQuestionInput,
  AdminQuizUpdate,
  AdminVideoCreate,
  AdminVideoDetail,
  AdminVideoUpdate,
} from "@/types/admin-content";
import { prisma } from "@/lib/prisma";

export type { AdminContentTarget } from "@/types/admin-content";

const VALID_TARGETS = new Set<AdminContentTarget>([
  "lecture-note",
  "video",
  "assignment",
  "quiz",
  "discussion",
]);

export function parseAdminContentTarget(slug: string): AdminContentTarget | null {
  return VALID_TARGETS.has(slug as AdminContentTarget) ? (slug as AdminContentTarget) : null;
}

function parseOptionalDate(
  value: string | null | undefined,
  field: string
): { skip: true } | { value: Date | null } | { error: string } {
  if (value === undefined) return { skip: true };
  if (value === null || value === "") return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: `Invalid ${field}.` };
  return { value: date };
}

async function assertCourseExists(courseId: string): Promise<{ error: string } | { course: { id: string } }> {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return { error: "Course not found." };
  return { course };
}

type LecturerCheck = { error: string } | { omit: true } | { lecturerId: string | null };

async function assertLecturerExists(lecturerId: string | null | undefined): Promise<LecturerCheck> {
  if (lecturerId === undefined) return { omit: true };
  if (lecturerId === null) return { lecturerId: null };
  const lecturer = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    select: { id: true },
  });
  if (!lecturer) return { error: "Lecturer not found." };
  return { lecturerId };
}

function lecturerIdForCreate(check: LecturerCheck): string | null {
  if ("lecturerId" in check) return check.lecturerId;
  return null;
}

function lecturerIdForUpdate(check: LecturerCheck): { lecturerId?: string | null } {
  if ("lecturerId" in check) return { lecturerId: check.lecturerId };
  return {};
}

function optionalDatePatch(
  parsed: { skip: true } | { value: Date | null } | { error: string },
  key: "expiresAt" | "dueDate"
): Partial<Record<"expiresAt" | "dueDate", Date | null>> {
  if ("value" in parsed) return { [key]: parsed.value };
  return {};
}

function optionalDateValue(
  parsed: { skip: true } | { value: Date | null } | { error: string },
  fallback: Date | null = null
): Date | null {
  if ("value" in parsed) return parsed.value ?? fallback;
  return fallback;
}

function mapQuizQuestions(questions: AdminQuizQuestionInput[]) {
  return questions.map((q) => ({
    question: q.question.trim(),
    optionA: q.optionA?.trim() || null,
    optionB: q.optionB?.trim() || null,
    optionC: q.optionC?.trim() || null,
    optionD: q.optionD?.trim() || null,
    correctAnswer: q.correctAnswer?.trim().toUpperCase() || null,
    marks: q.marks ?? 1,
  }));
}

export async function getAdminContentDetail(
  targetType: AdminContentTarget,
  targetId: string
): Promise<{ error: string } | { item: AdminContentDetail }> {
  switch (targetType) {
    case "lecture-note": {
      const note = await prisma.lectureNote.findUnique({
        where: { id: targetId },
        include: {
          course: { select: { courseCode: true, courseTitle: true } },
          lecturer: { include: { user: { select: { fullName: true } } } },
        },
      });
      if (!note) return { error: "Material not found." };
      const item: AdminLectureNoteDetail = {
        id: note.id,
        courseId: note.courseId,
        courseCode: note.course.courseCode,
        courseTitle: note.course.courseTitle,
        lecturerId: note.lecturerId,
        lecturerName: note.lecturer?.user.fullName ?? null,
        title: note.title,
        fileUrl: note.fileUrl,
        fileType: note.fileType,
        description: note.description,
        coverImageUrl: note.coverImageUrl,
        createdAt: note.createdAt.toISOString(),
      };
      return { item };
    }

    case "video": {
      const video = await prisma.video.findUnique({
        where: { id: targetId },
        include: {
          course: { select: { courseCode: true, courseTitle: true } },
          lecturer: { include: { user: { select: { fullName: true } } } },
        },
      });
      if (!video) return { error: "Video not found." };
      const item: AdminVideoDetail = {
        id: video.id,
        courseId: video.courseId,
        courseCode: video.course.courseCode,
        courseTitle: video.course.courseTitle,
        lecturerId: video.lecturerId,
        lecturerName: video.lecturer?.user.fullName ?? null,
        title: video.title,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        expiresAt: video.expiresAt?.toISOString() ?? null,
        deletionNotice: video.deletionNotice,
        createdAt: video.createdAt.toISOString(),
      };
      return { item };
    }

    case "assignment": {
      const assignment = await prisma.assignment.findUnique({
        where: { id: targetId },
        include: {
          course: { select: { courseCode: true, courseTitle: true } },
          lecturer: { include: { user: { select: { fullName: true } } } },
        },
      });
      if (!assignment) return { error: "Assignment not found." };
      const item: AdminAssignmentDetail = {
        id: assignment.id,
        courseId: assignment.courseId,
        courseCode: assignment.course.courseCode,
        courseTitle: assignment.course.courseTitle,
        lecturerId: assignment.lecturerId,
        lecturerName: assignment.lecturer?.user.fullName ?? null,
        title: assignment.title,
        instructions: assignment.instructions,
        attachmentUrl: assignment.attachmentUrl,
        dueDate: assignment.dueDate?.toISOString() ?? null,
        createdAt: assignment.createdAt.toISOString(),
      };
      return { item };
    }

    case "quiz": {
      const quiz = await prisma.quiz.findUnique({
        where: { id: targetId },
        include: {
          course: { select: { courseCode: true, courseTitle: true } },
          lecturer: { include: { user: { select: { fullName: true } } } },
          questions: { orderBy: { id: "asc" } },
        },
      });
      if (!quiz) return { error: "Quiz not found." };
      const item: AdminQuizDetail = {
        id: quiz.id,
        courseId: quiz.courseId,
        courseCode: quiz.course.courseCode,
        courseTitle: quiz.course.courseTitle,
        lecturerId: quiz.lecturerId,
        lecturerName: quiz.lecturer?.user.fullName ?? null,
        title: quiz.title,
        instructions: quiz.instructions,
        durationMinutes: quiz.durationMinutes,
        totalMarks: quiz.totalMarks,
        createdAt: quiz.createdAt.toISOString(),
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
        })),
      };
      return { item };
    }

    case "discussion": {
      const discussion = await prisma.discussion.findUnique({
        where: { id: targetId },
        include: {
          course: { select: { courseCode: true, courseTitle: true } },
          student: { include: { user: { select: { fullName: true } } } },
        },
      });
      if (!discussion) return { error: "Discussion not found." };
      const item: AdminDiscussionDetail = {
        id: discussion.id,
        courseId: discussion.courseId,
        courseCode: discussion.course?.courseCode ?? null,
        courseTitle: discussion.course?.courseTitle ?? null,
        studentId: discussion.studentId,
        studentName: discussion.student?.user.fullName ?? null,
        title: discussion.title,
        message: discussion.message,
        discussionType: discussion.discussionType,
        createdAt: discussion.createdAt.toISOString(),
      };
      return { item };
    }
  }
}

export async function deleteAdminContent(targetType: AdminContentTarget, targetId: string) {
  switch (targetType) {
    case "lecture-note":
      await prisma.contentComment.deleteMany({
        where: { targetType: "LECTURE_NOTE", targetId },
      });
      await prisma.contentLike.deleteMany({ where: { targetType: "LECTURE_NOTE", targetId } });
      await prisma.lectureNote.delete({ where: { id: targetId } });
      return "Material deleted.";

    case "video":
      await prisma.contentComment.deleteMany({
        where: { targetType: "VIDEO", targetId },
      });
      await prisma.contentLike.deleteMany({ where: { targetType: "VIDEO", targetId } });
      await prisma.video.delete({ where: { id: targetId } });
      return "Video deleted.";

    case "assignment":
      await prisma.$transaction([
        prisma.submission.deleteMany({ where: { assignmentId: targetId } }),
        prisma.assignment.delete({ where: { id: targetId } }),
      ]);
      return "Assignment deleted.";

    case "quiz":
      await prisma.$transaction([
        prisma.quizAttempt.deleteMany({ where: { quizId: targetId } }),
        prisma.quizQuestion.deleteMany({ where: { quizId: targetId } }),
        prisma.quiz.delete({ where: { id: targetId } }),
      ]);
      return "Quiz deleted.";

    case "discussion":
      await prisma.$transaction([
        prisma.comment.deleteMany({ where: { discussionId: targetId } }),
        prisma.discussion.delete({ where: { id: targetId } }),
      ]);
      return "Discussion deleted.";
  }
}

export async function updateAdminContent(
  targetType: AdminContentTarget,
  targetId: string,
  body: AdminContentUpdateBody
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  switch (targetType) {
    case "lecture-note":
      return updateLectureNote(targetId, body as AdminLectureNoteUpdate);
    case "video":
      return updateVideo(targetId, body as AdminVideoUpdate);
    case "assignment":
      return updateAssignment(targetId, body as AdminAssignmentUpdate);
    case "quiz":
      return updateQuiz(targetId, body as AdminQuizUpdate);
    case "discussion":
      return updateDiscussion(targetId, body as AdminDiscussionUpdate);
  }
}

async function updateLectureNote(
  targetId: string,
  body: AdminLectureNoteUpdate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const existing = await prisma.lectureNote.findUnique({ where: { id: targetId } });
  if (!existing) return { error: "Material not found." };

  if (body.courseId) {
    const courseCheck = await assertCourseExists(body.courseId);
    if ("error" in courseCheck) return { error: courseCheck.error };
  }
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  await prisma.lectureNote.update({
    where: { id: targetId },
    data: {
      title: body.title?.trim() ?? existing.title,
      description:
        body.description !== undefined ? body.description?.trim() || null : existing.description,
      fileUrl: body.fileUrl?.trim() ?? existing.fileUrl,
      fileType: body.fileType !== undefined ? body.fileType?.trim() || null : existing.fileType,
      coverImageUrl:
        body.coverImageUrl !== undefined
          ? body.coverImageUrl?.trim() || null
          : existing.coverImageUrl,
      courseId: body.courseId ?? existing.courseId,
      ...lecturerIdForUpdate(lecturerCheck),
    },
  });

  const detail = await getAdminContentDetail("lecture-note", targetId);
  if ("error" in detail) return detail;
  return { message: "Material updated.", item: detail.item };
}

async function updateVideo(
  targetId: string,
  body: AdminVideoUpdate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const existing = await prisma.video.findUnique({ where: { id: targetId } });
  if (!existing) return { error: "Video not found." };

  if (body.courseId) {
    const courseCheck = await assertCourseExists(body.courseId);
    if ("error" in courseCheck) return { error: courseCheck.error };
  }
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  const expiresAt = parseOptionalDate(body.expiresAt, "expiresAt");
  if ("error" in expiresAt) return { error: expiresAt.error };

  await prisma.video.update({
    where: { id: targetId },
    data: {
      title: body.title !== undefined ? body.title?.trim() || null : existing.title,
      videoUrl: body.videoUrl?.trim() ?? existing.videoUrl,
      thumbnailUrl:
        body.thumbnailUrl !== undefined
          ? body.thumbnailUrl?.trim() || null
          : existing.thumbnailUrl,
      duration: body.duration !== undefined ? body.duration?.trim() || null : existing.duration,
      deletionNotice:
        body.deletionNotice !== undefined
          ? body.deletionNotice?.trim() || null
          : existing.deletionNotice,
      courseId: body.courseId ?? existing.courseId,
      ...optionalDatePatch(expiresAt, "expiresAt"),
      ...lecturerIdForUpdate(lecturerCheck),
    },
  });

  const detail = await getAdminContentDetail("video", targetId);
  if ("error" in detail) return detail;
  return { message: "Video updated.", item: detail.item };
}

async function updateAssignment(
  targetId: string,
  body: AdminAssignmentUpdate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const existing = await prisma.assignment.findUnique({ where: { id: targetId } });
  if (!existing) return { error: "Assignment not found." };

  if (body.courseId) {
    const courseCheck = await assertCourseExists(body.courseId);
    if ("error" in courseCheck) return { error: courseCheck.error };
  }
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  const dueDate = parseOptionalDate(body.dueDate, "dueDate");
  if ("error" in dueDate) return { error: dueDate.error };

  await prisma.assignment.update({
    where: { id: targetId },
    data: {
      title: body.title !== undefined ? body.title?.trim() || null : existing.title,
      instructions:
        body.instructions !== undefined
          ? body.instructions?.trim() || null
          : existing.instructions,
      attachmentUrl:
        body.attachmentUrl !== undefined
          ? body.attachmentUrl?.trim() || null
          : existing.attachmentUrl,
      courseId: body.courseId ?? existing.courseId,
      ...optionalDatePatch(dueDate, "dueDate"),
      ...lecturerIdForUpdate(lecturerCheck),
    },
  });

  const detail = await getAdminContentDetail("assignment", targetId);
  if ("error" in detail) return detail;
  return { message: "Assignment updated.", item: detail.item };
}

async function updateQuiz(
  targetId: string,
  body: AdminQuizUpdate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const existing = await prisma.quiz.findUnique({ where: { id: targetId } });
  if (!existing) return { error: "Quiz not found." };

  if (body.courseId) {
    const courseCheck = await assertCourseExists(body.courseId);
    if ("error" in courseCheck) return { error: courseCheck.error };
  }
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  const questionRows =
    body.questions !== undefined ? mapQuizQuestions(body.questions) : undefined;
  const totalMarks =
    questionRows !== undefined
      ? questionRows.reduce((sum, q) => sum + q.marks, 0)
      : body.totalMarks !== undefined
        ? body.totalMarks
        : existing.totalMarks;

  await prisma.$transaction(async (tx) => {
    await tx.quiz.update({
      where: { id: targetId },
      data: {
        title: body.title !== undefined ? body.title?.trim() || null : existing.title,
        instructions:
          body.instructions !== undefined
            ? body.instructions?.trim() || null
            : existing.instructions,
        durationMinutes:
          body.durationMinutes !== undefined ? body.durationMinutes : existing.durationMinutes,
        totalMarks,
        courseId: body.courseId ?? existing.courseId,
        ...lecturerIdForUpdate(lecturerCheck),
      },
    });

    if (questionRows !== undefined) {
      await tx.quizQuestion.deleteMany({ where: { quizId: targetId } });
      if (questionRows.length > 0) {
        await tx.quizQuestion.createMany({
          data: questionRows.map((q) => ({ ...q, quizId: targetId })),
        });
      }
    }
  });

  const detail = await getAdminContentDetail("quiz", targetId);
  if ("error" in detail) return detail;
  return { message: "Quiz updated.", item: detail.item };
}

async function updateDiscussion(
  targetId: string,
  body: AdminDiscussionUpdate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const existing = await prisma.discussion.findUnique({ where: { id: targetId } });
  if (!existing) return { error: "Discussion not found." };

  if (body.courseId) {
    const courseCheck = await assertCourseExists(body.courseId);
    if ("error" in courseCheck) return { error: courseCheck.error };
  }

  await prisma.discussion.update({
    where: { id: targetId },
    data: {
      title: body.title !== undefined ? body.title?.trim() || null : existing.title,
      message: body.message !== undefined ? body.message?.trim() || null : existing.message,
      discussionType: (body.discussionType as DiscussionType | undefined) ?? existing.discussionType,
      courseId: body.courseId !== undefined ? body.courseId : existing.courseId,
      studentId: body.studentId !== undefined ? body.studentId : existing.studentId,
    },
  });

  const detail = await getAdminContentDetail("discussion", targetId);
  if ("error" in detail) return detail;
  return { message: "Discussion updated.", item: detail.item };
}

export async function createAdminContent(
  targetType: AdminContentTarget,
  body: Record<string, unknown>
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  switch (targetType) {
    case "lecture-note":
      return createLectureNote(body as AdminLectureNoteCreate);
    case "video":
      return createVideo(body as AdminVideoCreate);
    case "assignment":
      return createAssignment(body as AdminAssignmentCreate);
    case "quiz":
      return createQuiz(body as AdminQuizCreate);
    case "discussion":
      return createDiscussion(body as AdminDiscussionCreate);
  }
}

async function createLectureNote(
  body: AdminLectureNoteCreate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const courseId = body.courseId?.trim();
  const title = body.title?.trim();
  const fileUrl = body.fileUrl?.trim();
  if (!courseId || !title || !fileUrl) {
    return { error: "courseId, title, and fileUrl are required." };
  }

  const courseCheck = await assertCourseExists(courseId);
  if ("error" in courseCheck) return { error: courseCheck.error };
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  const note = await prisma.lectureNote.create({
    data: {
      courseId,
      title,
      fileUrl,
      fileType: body.fileType?.trim() || null,
      description: body.description?.trim() || null,
      coverImageUrl: body.coverImageUrl?.trim() || null,
      lecturerId: lecturerIdForCreate(lecturerCheck),
    },
  });

  const detail = await getAdminContentDetail("lecture-note", note.id);
  if ("error" in detail) return detail;
  return { message: "Material created.", item: detail.item };
}

async function createVideo(
  body: AdminVideoCreate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const courseId = body.courseId?.trim();
  const videoUrl = body.videoUrl?.trim();
  if (!courseId || !videoUrl) {
    return { error: "courseId and videoUrl are required." };
  }

  const courseCheck = await assertCourseExists(courseId);
  if ("error" in courseCheck) return { error: courseCheck.error };
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  const expiresAtParsed = parseOptionalDate(body.expiresAt, "expiresAt");
  if ("error" in expiresAtParsed) return { error: expiresAtParsed.error };
  const expiresAt = optionalDateValue(expiresAtParsed, null);

  const video = await prisma.video.create({
    data: {
      courseId,
      videoUrl,
      title: body.title?.trim() || null,
      thumbnailUrl: body.thumbnailUrl?.trim() || null,
      duration: body.duration?.trim() || null,
      expiresAt,
      deletionNotice: body.deletionNotice?.trim() || null,
      lecturerId: lecturerIdForCreate(lecturerCheck),
    },
  });

  const detail = await getAdminContentDetail("video", video.id);
  if ("error" in detail) return detail;
  return { message: "Video created.", item: detail.item };
}

async function createAssignment(
  body: AdminAssignmentCreate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const courseId = body.courseId?.trim();
  if (!courseId) return { error: "courseId is required." };

  const courseCheck = await assertCourseExists(courseId);
  if ("error" in courseCheck) return { error: courseCheck.error };
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  const dueDate = parseOptionalDate(body.dueDate, "dueDate");
  if ("error" in dueDate) return { error: dueDate.error };

  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      title: body.title?.trim() || null,
      instructions: body.instructions?.trim() || null,
      attachmentUrl: body.attachmentUrl?.trim() || null,
      dueDate: optionalDateValue(dueDate),
      lecturerId: lecturerIdForCreate(lecturerCheck),
    },
  });

  const detail = await getAdminContentDetail("assignment", assignment.id);
  if ("error" in detail) return detail;
  return { message: "Assignment created.", item: detail.item };
}

async function createQuiz(
  body: AdminQuizCreate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  const courseId = body.courseId?.trim();
  if (!courseId) return { error: "courseId is required." };
  if (!body.questions?.length) return { error: "At least one question is required." };

  const courseCheck = await assertCourseExists(courseId);
  if ("error" in courseCheck) return { error: courseCheck.error };
  const lecturerCheck = await assertLecturerExists(body.lecturerId);
  if ("error" in lecturerCheck) return { error: lecturerCheck.error };

  const questionRows = mapQuizQuestions(body.questions);
  const totalMarks = questionRows.reduce((sum, q) => sum + q.marks, 0);

  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      title: body.title?.trim() || null,
      instructions: body.instructions?.trim() || null,
      durationMinutes: body.durationMinutes ?? null,
      totalMarks,
      lecturerId: lecturerIdForCreate(lecturerCheck),
      questions: { create: questionRows },
    },
  });

  const detail = await getAdminContentDetail("quiz", quiz.id);
  if ("error" in detail) return detail;
  return { message: "Quiz created.", item: detail.item };
}

async function createDiscussion(
  body: AdminDiscussionCreate
): Promise<{ error: string } | { message: string; item: AdminContentDetail }> {
  if (body.courseId) {
    const courseCheck = await assertCourseExists(body.courseId);
    if ("error" in courseCheck) return { error: courseCheck.error };
  }

  const discussion = await prisma.discussion.create({
    data: {
      courseId: body.courseId ?? null,
      studentId: body.studentId ?? null,
      title: body.title?.trim() || null,
      message: body.message?.trim() || null,
      discussionType: (body.discussionType as DiscussionType | undefined) ?? "COURSE",
    },
  });

  const detail = await getAdminContentDetail("discussion", discussion.id);
  if ("error" in detail) return detail;
  return { message: "Discussion created.", item: detail.item };
}
