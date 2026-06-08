import type { AppRole } from "@/types/app";

type NoticeInput = {
  title: string;
  message?: string;
  targetUrl?: string | null;
};

const GENERIC_TARGETS = new Set([
  "/student/dashboard",
  "/lecturer/dashboard",
  "/admin/dashboard",
]);

const ROLE_INBOX: Record<AppRole, string> = {
  student: "/student/notifications",
  lecturer: "/lecturer/notifications",
  admin: "/admin/dashboard",
};

const TITLE_ROUTES: {
  match: RegExp;
  student?: string;
  lecturer?: string;
  admin?: string;
}[] = [
  { match: /^New Quiz:/i, student: "/student/quizzes", admin: "/admin/content/quizzes" },
  {
    match: /^New Assignment:/i,
    student: "/student/assignments",
    admin: "/admin/content/assignments",
  },
  {
    match: /^New Video lesson:/i,
    student: "/student/video-lessons",
    admin: "/admin/content/videos",
  },
  {
    match: /^New Course material:/i,
    student: "/student/lecture-notes",
    admin: "/admin/content/lecture-notes",
  },
  {
    match: /^New Discussion:/i,
    student: "/student/discussions",
    admin: "/admin/content/discussions",
  },
  {
    match: /^(Message|Notice|Announcement)/i,
    student: "/student/notifications",
    lecturer: "/lecturer/notifications",
  },
];

function roleRoute(
  role: AppRole,
  routes: { student?: string; lecturer?: string; admin?: string },
): string | null {
  if (role === "student") return routes.student ?? null;
  if (role === "lecturer") return routes.lecturer ?? null;
  return routes.admin ?? null;
}

function inferFromTitle(role: AppRole, title: string): string | null {
  for (const route of TITLE_ROUTES) {
    if (route.match.test(title)) {
      return roleRoute(role, route);
    }
  }
  return null;
}

/** Resolve where a notification click should navigate for the given role. */
export function resolveNotificationTargetUrl(role: AppRole, notice: NoticeInput): string {
  const raw = notice.targetUrl?.trim() ?? "";

  if (raw && !GENERIC_TARGETS.has(raw)) {
    return raw;
  }

  const inferred = inferFromTitle(role, notice.title);
  if (inferred) return inferred;

  if (role === "student" || role === "lecturer") {
    return ROLE_INBOX[role];
  }

  return raw || ROLE_INBOX[role];
}

export function isSameAppPath(currentPath: string, targetUrl: string): boolean {
  const targetPath = targetUrl.split("?")[0].split("#")[0];
  return currentPath === targetPath || (targetPath !== "/" && currentPath.startsWith(`${targetPath}/`));
}
