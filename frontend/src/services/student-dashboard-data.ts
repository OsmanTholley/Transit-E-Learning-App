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
  { label: "My Courses", href: "/student/courses", icon: "courses" },
  { label: "Lecture Notes", href: "/student/lecture-notes", icon: "notes" },
  { label: "Video Lessons", href: "/student/video-lessons", icon: "videos" },
  { label: "Quizzes", href: "/student/quizzes", icon: "quizzes" },
  { label: "Discussions", href: "/student/discussions", icon: "discussions" },
  { label: "AI Tutor", href: "/student/ai-tutor", icon: "ai" },
  { label: "Notices", href: "/student/notifications", icon: "notifications" },
  { label: "Profile", href: "/student/profile", icon: "profile" },
  { label: "Settings", href: "/student/settings", icon: "settings" },
] as const;
