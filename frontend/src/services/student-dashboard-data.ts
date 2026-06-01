import { myCoursesSubmenu } from "@/components/student/courses/course-nav-config";
import { lectureNotesSubmenu } from "@/components/student/lecture-notes/notes-nav-config";
import { videoLessonsSubmenu } from "@/components/student/video-lessons/video-lessons-nav-config";
import { quizzesSubmenu } from "@/components/student/quizzes/quizzes-nav-config";
import { discussionsSubmenu } from "@/components/student/discussions/discussions-nav-config";
import { aiTutorSubmenu } from "@/components/student/ai-tutor/ai-tutor-nav-config";

function navSidebarLabel(item: { label: string; sidebarLabel?: string }) {
  return item.sidebarLabel ?? item.label;
}

export type StudentCourse = {
  id: string;
  title: string;
  code: string;
  progress: number;
  thumbnail: string;
  thumbnailBg: string;
};

export type StudentAssignment = {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  type: "pdf" | "doc";
};

export type StudentLectureNote = {
  id: string;
  title: string;
  course: string;
  format: string;
};

export const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  {
    label: "My Courses",
    href: "/student/courses",
    icon: "courses",
    children: myCoursesSubmenu.map((item) => ({ label: navSidebarLabel(item), href: item.href })),
  },
  {
    label: "Lecture Notes",
    href: "/student/lecture-notes",
    icon: "notes",
    children: lectureNotesSubmenu.map((item) => ({ label: navSidebarLabel(item), href: item.href })),
  },
  {
    label: "Video Lessons",
    href: "/student/video-lessons",
    icon: "videos",
    children: videoLessonsSubmenu.map((item) => ({ label: navSidebarLabel(item), href: item.href })),
  },
  { label: "Live Classroom", href: "/student/live-classroom", icon: "live" },
  {
    label: "Quizzes",
    href: "/student/quizzes",
    icon: "quizzes",
    children: quizzesSubmenu.map((item) => ({ label: navSidebarLabel(item), href: item.href })),
  },
  {
    label: "Discussions",
    href: "/student/discussions",
    icon: "discussions",
    children: discussionsSubmenu.map((item) => ({ label: navSidebarLabel(item), href: item.href })),
  },
  {
    label: "AI Tutor",
    href: "/student/ai-tutor",
    icon: "ai",
    children: aiTutorSubmenu.map((item) => ({ label: navSidebarLabel(item), href: item.href })),
  },
  { label: "Notices", href: "/student/notifications", icon: "notifications" },
  { label: "Profile", href: "/student/profile", icon: "profile" },
  { label: "Settings", href: "/student/settings", icon: "settings" },
] as const;
