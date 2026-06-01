export const lectureNotesSubmenu = [
  { label: "All Notes", sidebarLabel: "All", href: "/student/lecture-notes", slug: "" },
  { label: "Recent Notes", sidebarLabel: "Recent", href: "/student/lecture-notes/recent", slug: "recent" },
  { label: "Downloaded Notes", sidebarLabel: "Downloaded", href: "/student/lecture-notes/downloaded", slug: "downloaded" },
  { label: "Bookmarked Notes", sidebarLabel: "Bookmarked", href: "/student/lecture-notes/bookmarked", slug: "bookmarked" },
  { label: "Course Notes", sidebarLabel: "By Course", href: "/student/lecture-notes/by-course", slug: "by-course" },
  { label: "Semester Notes", sidebarLabel: "By Semester", href: "/student/lecture-notes/by-semester", slug: "by-semester" },
  { label: "Shared Materials", href: "/student/lecture-notes/shared", slug: "shared" },
  { label: "Reading Progress", href: "/student/lecture-notes/progress", slug: "progress" },
  { label: "Search Notes", sidebarLabel: "Search", href: "/student/lecture-notes/search", slug: "search" },
] as const;

export function notesViewTitle(slug: string) {
  return lectureNotesSubmenu.find((s) => s.slug === slug)?.label ?? "Lecture Notes";
}
