export type QuestionStatus = "answered" | "pending" | "unanswered";

export type DiscussionSummary = {
  id: string;
  title: string;
  message: string;
  preview: string;
  courseId: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  authorId: string | null;
  authorName: string;
  authorInitials: string;
  isOwn: boolean;
  discussionType: "COURSE" | "PROGRAM" | "GENERAL";
  createdAt: string;
  replyCount: number;
  likeCount: number;
  questionStatus: QuestionStatus;
  isAnnouncement: boolean;
};

export type DiscussionComment = {
  id: string;
  authorName: string;
  authorInitials: string;
  authorRole: "student" | "lecturer" | "admin";
  comment: string;
  createdAt: string;
  isPinned: boolean;
};

export type DiscussionDetail = DiscussionSummary & {
  comments: DiscussionComment[];
};

export type CreateDiscussionInput = {
  title: string;
  message: string;
  courseId?: string | null;
  discussionType: "COURSE" | "PROGRAM" | "GENERAL";
};
