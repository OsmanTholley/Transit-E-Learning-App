export const myCoursesSubmenu = [
  { label: "All Courses", sidebarLabel: "All", href: "/student/courses", slug: "" },
  {
    label: "Current Semester",
    href: "/student/courses/current-semester",
    slug: "current-semester",
  },
  {
    label: "Completed Courses",
    sidebarLabel: "Completed",
    href: "/student/courses?filter=completed",
    slug: "completed",
  },
  {
    label: "Lecture Notes",
    sidebarLabel: "Notes",
    href: "/student/courses/lecture-notes",
    slug: "lecture-notes",
  },
  {
    label: "Video Lessons",
    sidebarLabel: "Videos",
    href: "/student/courses/videos",
    slug: "videos",
  },
  { label: "Quizzes", href: "/student/courses/quizzes", slug: "quizzes" },
  { label: "Discussions", href: "/student/courses/discussions", slug: "discussions" },
  { label: "Bookmarks", href: "/student/courses/bookmarks", slug: "bookmarks" },
  {
    label: "Course Progress",
    sidebarLabel: "Progress",
    href: "/student/courses/progress",
    slug: "progress",
  },
] as const;

export type CoursesViewSlug = (typeof myCoursesSubmenu)[number]["slug"];

export function getCoursesViewTitle(slug: string) {
  const item = myCoursesSubmenu.find((s) => s.slug === slug);
  return item?.label ?? "My Courses";
}
