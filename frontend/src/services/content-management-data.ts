import { ContentItem, ReportedContent } from "@/types/academic";

export const contentSubmenu = [
  { label: "Lecture Notes", href: "/admin/content/lecture-notes" },
  { label: "Videos", href: "/admin/content/videos" },
  { label: "Assignments", href: "/admin/content/assignments" },
  { label: "Quizzes", href: "/admin/content/quizzes" },
  { label: "Discussions", href: "/admin/content/discussions" },
  { label: "AI Tutor Content", href: "/admin/content/ai-tutor" },
  { label: "Uploaded Files", href: "/admin/content/files" },
  { label: "Content Approval", href: "/admin/content/approval" },
  { label: "Reported Content", href: "/admin/content/reported" },
  { label: "Content Analytics", href: "/admin/content/analytics" },
] as const;

export const mockLectureNotes: ContentItem[] = [
  { id: "n1", title: "Week 5 – OOP Concepts", type: "PDF", course: "CSC101", department: "Computing Sciences", lecturer: "Dr. Ada Lecturer", uploadedAt: "2025-05-27", status: "Approved" },
  { id: "n2", title: "Database Normalization", type: "DOCX", course: "CSC301", department: "Computing Sciences", lecturer: "Mr. James Kamara", uploadedAt: "2025-05-26", status: "Pending" },
];

export const mockVideos: ContentItem[] = [
  { id: "v1", title: "React Hooks Tutorial", type: "Video", course: "CSC301", department: "Computing Sciences", lecturer: "Mr. James Kamara", uploadedAt: "2025-05-25", status: "Approved" },
  { id: "v2", title: "Intro to SQL", type: "Video", course: "CSC301", department: "Computing Sciences", lecturer: "Mr. James Kamara", uploadedAt: "2025-05-24", status: "Pending" },
];

export const mockContentAssignments: ContentItem[] = [
  { id: "a1", title: "Variables and Loops", type: "Assignment", course: "CSC101", department: "Computing Sciences", lecturer: "Dr. Ada Lecturer", uploadedAt: "2025-05-28", status: "Approved" },
];

export const mockContentQuizzes: ContentItem[] = [
  { id: "q1", title: "Week 3 Quiz", type: "Quiz", course: "CSC101", department: "Computing Sciences", lecturer: "Dr. Ada Lecturer", uploadedAt: "2025-05-27", status: "Approved" },
];

export const mockDiscussions: ContentItem[] = [
  { id: "d1", title: "Welcome discussion thread", type: "Discussion", course: "CSC101", department: "Computing Sciences", lecturer: "—", uploadedAt: "2025-05-26", status: "Approved" },
];

export const mockReported: ReportedContent[] = [
  { id: "r1", contentTitle: "Off-topic forum post", reportedBy: "Alice Student", reason: "Spam", date: "2025-05-28", status: "Open" },
  { id: "r2", contentTitle: "Uploaded video – poor quality", reportedBy: "John Kamara", reason: "Inappropriate", date: "2025-05-27", status: "Open" },
];

export const contentOverviewStats = {
  totalNotes: 1240,
  totalVideos: 386,
  totalQuizzes: 512,
  totalAssignments: 890,
  pendingApproval: 24,
  reportedItems: 7,
};
