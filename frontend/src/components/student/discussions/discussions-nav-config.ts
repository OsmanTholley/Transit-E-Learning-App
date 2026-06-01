export const discussionsSubmenu = [
  { label: "General Discussions", sidebarLabel: "General", href: "/student/discussions", slug: "" },
  { label: "Course Discussions", sidebarLabel: "By Course", href: "/student/discussions/courses", slug: "courses" },
  { label: "My Questions", href: "/student/discussions/my-questions", slug: "my-questions" },
  { label: "Lecturer Announcements", sidebarLabel: "Announcements", href: "/student/discussions/announcements", slug: "announcements" },
  { label: "Trending Topics", href: "/student/discussions/trending", slug: "trending" },
  { label: "Study Groups", href: "/student/discussions/study-groups", slug: "study-groups" },
  { label: "Saved Discussions", sidebarLabel: "Saved", href: "/student/discussions/saved", slug: "saved" },
  { label: "Discussion Notifications", sidebarLabel: "Notifications", href: "/student/discussions/notifications", slug: "notifications" },
  { label: "AI Tutor Discussions", sidebarLabel: "AI Tutor", href: "/student/discussions/ai-tutor", slug: "ai-tutor" },
] as const;

export type DiscussionsViewSlug = (typeof discussionsSubmenu)[number]["slug"];

export function getDiscussionsViewTitle(slug: string) {
  const item = discussionsSubmenu.find((s) => s.slug === slug);
  return item?.label ?? "Discussions";
}
