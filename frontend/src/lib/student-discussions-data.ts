import { prisma } from "@/lib/prisma";
import type {
  CreateDiscussionInput,
  DiscussionComment,
  DiscussionDetail,
  DiscussionSummary,
  QuestionStatus,
} from "@/types/student-discussions";

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "S") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function deriveQuestionStatus(
  commentCount: number,
  hasLecturerReply: boolean
): QuestionStatus {
  if (commentCount === 0) return "unanswered";
  if (hasLecturerReply) return "answered";
  return "pending";
}

async function getStudentContext(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      user: { select: { fullName: true } },
      courseStudents: { select: { courseId: true } },
    },
  });
}

function mapDiscussion(
  d: {
    id: string;
    title: string | null;
    message: string | null;
    courseId: string | null;
    studentId: string | null;
    discussionType: "COURSE" | "PROGRAM" | "GENERAL";
    createdAt: Date;
    course: { courseCode: string; courseTitle: string } | null;
    student: { user: { fullName: string }; id: string } | null;
    comments: { user: { role: string; fullName: string } | null }[];
    _count: { comments: number };
  },
  currentStudentId: string
): DiscussionSummary {
  const authorName = d.student?.user.fullName ?? "Community Member";
  const message = d.message ?? "";
  const hasLecturerReply = d.comments.some((c) => c.user?.role === "LECTURER");

  return {
    id: d.id,
    title: d.title ?? "Discussion",
    message,
    preview: message.length > 140 ? `${message.slice(0, 140)}…` : message,
    courseId: d.courseId,
    courseCode: d.course?.courseCode ?? null,
    courseTitle: d.course?.courseTitle ?? null,
    authorId: d.studentId,
    authorName,
    authorInitials: initials(authorName),
    isOwn: d.studentId === currentStudentId,
    discussionType: d.discussionType,
    createdAt: d.createdAt.toISOString(),
    replyCount: d._count.comments,
    likeCount: 0,
    questionStatus: deriveQuestionStatus(d._count.comments, hasLecturerReply),
    isAnnouncement: d.discussionType === "PROGRAM",
  };
}

const discussionInclude = {
  course: { select: { courseCode: true, courseTitle: true } },
  student: { include: { user: { select: { fullName: true } } } },
  comments: {
    take: 20,
    orderBy: { createdAt: "desc" as const },
    include: { user: { select: { role: true, fullName: true } } },
  },
  _count: { select: { comments: true } },
};

export async function listDiscussionsForStudent(
  userId: string,
  filter?: {
    view?: string;
    courseId?: string;
    search?: string;
  }
): Promise<DiscussionSummary[]> {
  const student = await getStudentContext(userId);
  if (!student) return [];

  const courseIds = student.courseStudents.map((e) => e.courseId);

  const whereBase = {
    OR: [
      { courseId: { in: courseIds } },
      { discussionType: "GENERAL" as const },
      { discussionType: "PROGRAM" as const },
      { studentId: student.id },
    ],
  };

  const typeFilters: Record<string, unknown>[] = [];
  const view = filter?.view ?? "";

  if (view === "courses") {
    typeFilters.push({ discussionType: "COURSE", courseId: { in: courseIds } });
  } else if (view === "my-questions") {
    typeFilters.push({ studentId: student.id });
  } else if (view === "announcements") {
    typeFilters.push({ discussionType: "PROGRAM" });
  } else if (view === "general") {
    typeFilters.push({ discussionType: "GENERAL" });
  }

  const rows = await prisma.discussion.findMany({
    where: {
      AND: [
        whereBase,
        ...typeFilters,
        ...(filter?.courseId ? [{ courseId: filter.courseId }] : []),
      ],
    },
    include: discussionInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  let mapped = rows.map((d) => mapDiscussion(d, student.id));

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    mapped = mapped.filter((d) =>
      `${d.title} ${d.message} ${d.courseCode ?? ""} ${d.authorName}`.toLowerCase().includes(q)
    );
  }

  if (view === "trending") {
    mapped = [...mapped].sort((a, b) => b.replyCount - a.replyCount || b.likeCount - a.likeCount);
  }

  return mapped;
}

export async function getDiscussionForStudent(
  userId: string,
  discussionId: string
): Promise<DiscussionDetail | null> {
  const student = await getStudentContext(userId);
  if (!student) return null;

  const courseIds = student.courseStudents.map((e) => e.courseId);

  const d = await prisma.discussion.findFirst({
    where: {
      id: discussionId,
      OR: [
        { courseId: { in: courseIds } },
        { discussionType: "GENERAL" },
        { discussionType: "PROGRAM" },
        { studentId: student.id },
      ],
    },
    include: {
      ...discussionInclude,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { role: true, fullName: true } } },
      },
    },
  });

  if (!d) return null;

  const summary = mapDiscussion(
    {
      ...d,
      comments: d.comments.map((c) => ({ user: c.user })),
    },
    student.id
  );

  const comments: DiscussionComment[] = d.comments.map((c, i) => ({
    id: c.id,
    authorName: c.user?.fullName ?? "User",
    authorInitials: initials(c.user?.fullName ?? "U"),
    authorRole:
      c.user?.role === "LECTURER" ? "lecturer" : c.user?.role === "ADMIN" ? "admin" : "student",
    comment: c.comment,
    createdAt: c.createdAt.toISOString(),
    isPinned: i === 0 && c.user?.role === "LECTURER",
  }));

  return { ...summary, comments };
}

export async function createDiscussionForStudent(
  userId: string,
  input: CreateDiscussionInput
) {
  const student = await getStudentContext(userId);
  if (!student) return { error: "Unauthorized.", status: 401 };

  if (input.courseId) {
    const enrolled = student.courseStudents.some((e) => e.courseId === input.courseId);
    if (!enrolled) return { error: "You are not enrolled in this course.", status: 403 };
  }

  const created = await prisma.discussion.create({
    data: {
      title: input.title.trim(),
      message: input.message.trim(),
      courseId: input.courseId ?? null,
      studentId: student.id,
      discussionType: input.discussionType,
    },
    include: discussionInclude,
  });

  return { discussion: mapDiscussion(created, student.id) };
}

export async function addCommentToDiscussion(
  userId: string,
  discussionId: string,
  comment: string
) {
  const student = await getStudentContext(userId);
  if (!student) return { error: "Unauthorized.", status: 401 };

  const discussion = await getDiscussionForStudent(userId, discussionId);
  if (!discussion) return { error: "Discussion not found.", status: 404 };

  const created = await prisma.comment.create({
    data: {
      discussionId,
      userId: student.userId,
      comment: comment.trim(),
    },
    include: { user: { select: { role: true, fullName: true } } },
  });

  return {
    comment: {
      id: created.id,
      authorName: created.user?.fullName ?? student.user.fullName,
      authorInitials: initials(created.user?.fullName ?? student.user.fullName),
      authorRole: "student" as const,
      comment: created.comment,
      createdAt: created.createdAt.toISOString(),
      isPinned: false,
    },
  };
}

export { relativeTime };
