// All content data (lecture notes, videos, assignments, quizzes, discussions)
// is loaded from the database via the admin API routes.
// There are no hardcoded mock records here.

export const contentSubmenu = [
  { label: "Lecture Notes",    href: "/admin/content/lecture-notes" },
  { label: "Videos",           href: "/admin/content/videos" },
  { label: "Assignments",      href: "/admin/content/assignments" },
  { label: "Quizzes",          href: "/admin/content/quizzes" },
  { label: "Discussions",      href: "/admin/content/discussions" },
  { label: "AI Tutor Content", href: "/admin/content/ai-tutor" },
  { label: "Uploaded Files",   href: "/admin/content/files" },
  { label: "Content Approval", href: "/admin/content/approval" },
  { label: "Reported Content", href: "/admin/content/reported" },
  { label: "Content Analytics",href: "/admin/content/analytics" },
] as const;
