import { prisma } from "@/lib/prisma";
import type { ContentItem } from "@/types/academic";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type ContentRow = {
  id: string;
  title: string;
  type: string;
  course: string;
  department: string;
  lecturer: string;
  uploadedAt: string;
};

function toContentItem(row: ContentRow): ContentItem {
  return { ...row, status: "Approved" as const };
}

export async function buildAdminContentData() {
  const [notes, videos, assignments, quizzes, discussions] = await Promise.all([
    prisma.lectureNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        course: { select: { courseCode: true, department: { select: { departmentName: true } } } },
        lecturer: { select: { user: { select: { fullName: true } } } },
      },
    }),
    prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        course: { select: { courseCode: true, department: { select: { departmentName: true } } } },
        lecturer: { select: { user: { select: { fullName: true } } } },
      },
    }),
    prisma.assignment.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        course: { select: { courseCode: true, department: { select: { departmentName: true } } } },
        lecturer: { select: { user: { select: { fullName: true } } } },
      },
    }),
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        course: { select: { courseCode: true, department: { select: { departmentName: true } } } },
        lecturer: { select: { user: { select: { fullName: true } } } },
      },
    }),
    prisma.discussion.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        course: { select: { courseCode: true, department: { select: { departmentName: true } } } },
        student: { select: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  const lectureNotes = notes.map((n) =>
    toContentItem({
      id: n.id,
      title: n.title,
      type: n.fileType ?? "PDF",
      course: n.course.courseCode,
      department: n.course.department?.departmentName ?? "—",
      lecturer: n.lecturer?.user.fullName ?? "—",
      uploadedAt: formatDate(n.createdAt),
    })
  );

  const videoItems = videos.map((v) =>
    toContentItem({
      id: v.id,
      title: v.title ?? "Untitled video",
      type: "Video",
      course: v.course.courseCode,
      department: v.course.department?.departmentName ?? "—",
      lecturer: v.lecturer?.user.fullName ?? "—",
      uploadedAt: formatDate(v.createdAt),
    })
  );

  const assignmentItems = assignments.map((a) =>
    toContentItem({
      id: a.id,
      title: a.title ?? "Untitled assignment",
      type: "Assignment",
      course: a.course.courseCode,
      department: a.course.department?.departmentName ?? "—",
      lecturer: a.lecturer?.user.fullName ?? "—",
      uploadedAt: formatDate(a.createdAt),
    })
  );

  const quizItems = quizzes.map((q) =>
    toContentItem({
      id: q.id,
      title: q.title ?? "Untitled quiz",
      type: "Quiz",
      course: q.course.courseCode,
      department: q.course.department?.departmentName ?? "—",
      lecturer: q.lecturer?.user.fullName ?? "—",
      uploadedAt: formatDate(q.createdAt),
    })
  );

  const discussionItems = discussions.map((d) =>
    toContentItem({
      id: d.id,
      title: d.title ?? "Discussion thread",
      type: "Discussion",
      course: d.course?.courseCode ?? "—",
      department: d.course?.department?.departmentName ?? "—",
      lecturer: d.student?.user.fullName ?? "—",
      uploadedAt: formatDate(d.createdAt),
    })
  );

  const topLecturers = await prisma.lecturer.findMany({
    take: 5,
    include: {
      user: { select: { fullName: true } },
      _count: { select: { lectureNotes: true, videos: true, quizzes: true, assignments: true } },
    },
  });

  const lecturerUploads = [...topLecturers]
    .map((l) => ({
      name: l.user.fullName,
      uploads:
        l._count.lectureNotes + l._count.videos + l._count.quizzes + l._count.assignments,
    }))
    .sort((a, b) => b.uploads - a.uploads)
    .slice(0, 5);

  const aiChatCount = await prisma.aiChatHistory.count();

  return {
    stats: {
      totalNotes: lectureNotes.length,
      totalVideos: videoItems.length,
      totalQuizzes: quizItems.length,
      totalAssignments: assignmentItems.length,
      pendingApproval: 0,
      reportedItems: 0,
      aiChatSessions: aiChatCount,
    },
    lectureNotes,
    videos: videoItems,
    assignments: assignmentItems,
    quizzes: quizItems,
    discussions: discussionItems,
    topLecturers: lecturerUploads,
    topContent: [...lectureNotes, ...videoItems]
      .slice(0, 5)
      .map((item) => ({ title: item.title, views: "—" })),
  };
}
