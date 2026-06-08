import { prisma } from "@/lib/prisma";
import type { SectionContent } from "@/types/app";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const sectionMeta: Record<string, { title: string; subtitle: string }> = {
  assignments: {
    title: "Assignments",
    subtitle: "Monitor assignment creation and submissions.",
  },
  quizzes: {
    title: "Quizzes",
    subtitle: "Monitor quiz creation and attempts.",
  },
  discussions: {
    title: "Discussions",
    subtitle: "Moderate course, program, and general discussions.",
  },
  announcements: {
    title: "Announcements",
    subtitle: "Post platform-wide announcements.",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Review system notifications delivered to users.",
  },
  settings: {
    title: "System Settings",
    subtitle: "Manage platform configuration.",
  },
  "activity-logs": {
    title: "Activity Logs",
    subtitle: "Audit admin actions and important events.",
  },
};

export async function buildAdminSectionContent(section: string): Promise<SectionContent | null> {
  const meta = sectionMeta[section];
  if (!meta) return null;

  switch (section) {
    case "assignments": {
      const [total, recent, submissions, graded] = await Promise.all([
        prisma.assignment.count(),
        prisma.assignment.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            course: { select: { courseCode: true } },
            _count: { select: { submissions: true } },
          },
        }),
        prisma.submission.count(),
        prisma.submission.count({ where: { grade: { not: null } } }),
      ]);
      const gradedPct = submissions > 0 ? Math.round((graded / submissions) * 100) : 0;
      return {
        ...meta,
        stats: [
          { label: "Total assignments", value: String(total) },
          { label: "Submissions", value: String(submissions) },
          { label: "Graded", value: `${gradedPct}%` },
        ],
        table: {
          columns: ["Assignment", "Course", "Submissions", "Created"],
          rows: recent.map((a) => [
            a.title ?? "Untitled",
            a.course.courseCode,
            String(a._count.submissions),
            formatDate(a.createdAt),
          ]),
        },
      };
    }
    case "quizzes": {
      const [total, attempts, recent] = await Promise.all([
        prisma.quiz.count(),
        prisma.quizAttempt.count(),
        prisma.quiz.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            course: { select: { courseCode: true } },
            _count: { select: { quizAttempts: true } },
          },
        }),
      ]);
      return {
        ...meta,
        stats: [
          { label: "Total quizzes", value: String(total) },
          { label: "Total attempts", value: String(attempts) },
        ],
        table: {
          columns: ["Quiz", "Course", "Attempts", "Created"],
          rows: recent.map((q) => [
            q.title ?? "Untitled",
            q.course.courseCode,
            String(q._count.quizAttempts),
            formatDate(q.createdAt),
          ]),
        },
      };
    }
    case "discussions": {
      const [total, comments, recent] = await Promise.all([
        prisma.discussion.count(),
        prisma.comment.count(),
        prisma.discussion.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            course: { select: { courseCode: true } },
            student: { select: { user: { select: { fullName: true } } } },
            _count: { select: { comments: true } },
          },
        }),
      ]);
      return {
        ...meta,
        stats: [
          { label: "Discussion threads", value: String(total) },
          { label: "Comments", value: String(comments) },
        ],
        table: {
          columns: ["Title", "Course", "Author", "Comments", "Created"],
          rows: recent.map((d) => [
            d.title ?? "Untitled",
            d.course?.courseCode ?? "—",
            d.student?.user.fullName ?? "—",
            String(d._count.comments),
            formatDate(d.createdAt),
          ]),
        },
      };
    }
    case "announcements": {
      const [studentBroadcasts, lecturerBroadcasts] = await Promise.all([
        prisma.studentMessageBroadcast.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
        prisma.lecturerMessageBroadcast.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
        }),
      ]);
      const rows = [
        ...studentBroadcasts.map((b) => [
          b.title,
          "Students",
          b.audienceLabel,
          String(b.recipientCount),
          formatDate(b.createdAt),
        ]),
        ...lecturerBroadcasts.map((b) => [
          b.title,
          "Lecturers",
          b.audienceLabel,
          String(b.recipientCount),
          formatDate(b.createdAt),
        ]),
      ].slice(0, 12);
      return {
        ...meta,
        stats: [
          { label: "Student broadcasts", value: String(studentBroadcasts.length) },
          { label: "Lecturer broadcasts", value: String(lecturerBroadcasts.length) },
        ],
        table: {
          columns: ["Title", "Audience", "Target", "Recipients", "Sent"],
          rows,
        },
      };
    }
    case "notifications": {
      const [total, unread, recent] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { isRead: false } }),
        prisma.notification.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { fullName: true, role: true } } },
        }),
      ]);
      return {
        ...meta,
        stats: [
          { label: "Total notifications", value: String(total) },
          { label: "Unread", value: String(unread) },
        ],
        table: {
          columns: ["Title", "User", "Role", "Read", "Created"],
          rows: recent.map((n) => [
            n.title ?? "—",
            n.user?.fullName ?? "System",
            n.user?.role ?? "—",
            n.isRead ? "Yes" : "No",
            formatDate(n.createdAt),
          ]),
        },
      };
    }
    case "settings": {
      const [users, admins, activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.admin.count(),
        prisma.user.count({ where: { isActive: true } }),
      ]);
      return {
        ...meta,
        stats: [
          { label: "Total users", value: String(users) },
          { label: "Active users", value: String(activeUsers) },
          { label: "Admins", value: String(admins) },
        ],
        bullets: [
          "Role permissions are managed per user account.",
          "Contact your database administrator for environment configuration.",
        ],
      };
    }
    case "activity-logs": {
      const [recentUsers, recentCourses, recentNotes] = await Promise.all([
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { fullName: true, role: true, createdAt: true },
        }),
        prisma.course.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { courseCode: true, courseTitle: true, createdAt: true },
        }),
        prisma.lectureNote.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { title: true, createdAt: true },
        }),
      ]);
      const rows = [
        ...recentUsers.map((u) => [
          "User registered",
          u.fullName,
          u.role,
          formatDate(u.createdAt),
        ]),
        ...recentCourses.map((c) => [
          "Course created",
          c.courseCode,
          c.courseTitle,
          formatDate(c.createdAt),
        ]),
        ...recentNotes.map((n) => [
          "Lecture note uploaded",
          n.title,
          "—",
          formatDate(n.createdAt),
        ]),
      ].slice(0, 12);
      return {
        ...meta,
        table: {
          columns: ["Event", "Subject", "Detail", "When"],
          rows,
        },
      };
    }
    default:
      return null;
  }
}
