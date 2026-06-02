export const videoLessonsSubmenu = [
  { label: "All Videos", sidebarLabel: "All", href: "/student/video-lessons", slug: "" },
  { label: "Continue Watching", href: "/student/video-lessons/continue", slug: "continue" },
  { label: "Downloaded Videos", sidebarLabel: "Downloaded", href: "/student/video-lessons/downloaded", slug: "downloaded" },
  { label: "Course Playlists", sidebarLabel: "Playlists", href: "/student/video-lessons/playlists", slug: "playlists" },
  { label: "Recommended Videos", sidebarLabel: "Recommended", href: "/student/video-lessons/recommended", slug: "recommended" },
  { label: "Bookmarked Videos", sidebarLabel: "Bookmarked", href: "/student/video-lessons/bookmarked", slug: "bookmarked" },
  { label: "Watch History", sidebarLabel: "History", href: "/student/video-lessons/history", slug: "history" },
  { label: "Video Progress", sidebarLabel: "Progress", href: "/student/video-lessons/progress", slug: "progress" },
] as const;

export type VideoLessonsViewSlug = (typeof videoLessonsSubmenu)[number]["slug"];

export function getVideoLessonsViewTitle(slug: string) {
  const item = videoLessonsSubmenu.find((s) => s.slug === slug);
  return item?.label ?? "Video Lessons";
}
