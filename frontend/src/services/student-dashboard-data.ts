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

export type NewUpload = {
  id: string;
  type: "note" | "video";
  title: string;
  course: string;
  courseCode: string;
  lecturerName: string;
  lecturerInitials: string;
  uploadedAt: string;   // ISO string — formatted on the client
  href: string;
};

export const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  { label: "My Courses", href: "/student/courses", icon: "courses" },
  { label: "Lecture Notes", href: "/student/lecture-notes", icon: "notes" },
  { label: "Video Lessons", href: "/student/video-lessons", icon: "videos" },
  { label: "Assignments", href: "/student/assignments", icon: "assignments" },
  { label: "Quizzes", href: "/student/quizzes", icon: "quizzes" },
  { label: "Discussions", href: "/student/discussions", icon: "discussions" },
  { label: "Virtual Room", href: "/student/live-classes", icon: "live" },
  { label: "Billing", href: "/student/billing", icon: "billing" },
  { label: "Chat", href: "/student/chat", icon: "chat" },
  { label: "AI Tutor", href: "/student/ai-tutor", icon: "ai" },
  { label: "Profile", href: "/student/profile", icon: "profile" },
] as const;
