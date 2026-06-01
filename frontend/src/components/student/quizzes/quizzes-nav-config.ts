export const quizzesSubmenu = [
  { label: "All Quizzes", sidebarLabel: "All", href: "/student/quizzes", slug: "" },
  { label: "Upcoming Quizzes", sidebarLabel: "Upcoming", href: "/student/quizzes/upcoming", slug: "upcoming" },
  { label: "Active Quizzes", sidebarLabel: "Active", href: "/student/quizzes/active", slug: "active" },
  { label: "Completed Quizzes", sidebarLabel: "Completed", href: "/student/quizzes/completed", slug: "completed" },
  { label: "Quiz Results", sidebarLabel: "Results", href: "/student/quizzes/results", slug: "results" },
  { label: "Practice Quizzes", sidebarLabel: "Practice", href: "/student/quizzes/practice", slug: "practice" },
  { label: "Leaderboard", href: "/student/quizzes/leaderboard", slug: "leaderboard" },
  { label: "Quiz History", sidebarLabel: "History", href: "/student/quizzes/history", slug: "history" },
  { label: "Quiz Performance", sidebarLabel: "Performance", href: "/student/quizzes/performance", slug: "performance" },
] as const;

export type QuizzesViewSlug = (typeof quizzesSubmenu)[number]["slug"];

export function getQuizzesViewTitle(slug: string) {
  const item = quizzesSubmenu.find((s) => s.slug === slug);
  return item?.label ?? "Quizzes";
}
