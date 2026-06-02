export type LecturerCourseOption = {
  id: string;
  courseCode: string;
  courseTitle: string;
  label: string;
};

export type LecturerNoteRow = {
  id: string;
  title: string;
  course: string;
  courseId: string;
  fileUrl: string;
  fileType: string | null;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: string;
};

export type LecturerVideoRow = {
  id: string;
  title: string;
  course: string;
  courseId: string;
  videoUrl: string;
  duration: string | null;
  expiresAt: string | null;
  deletionNotice: string | null;
  createdAt: string;
};

export type LecturerQuizRow = {
  id: string;
  title: string;
  course: string;
  attempts: number;
  averageScore: number;
  questionCount: number;
};

export type LecturerAssignmentRow = {
  id: string;
  title: string;
  course: string;
  courseId: string;
  instructions: string | null;
  attachmentUrl: string | null;
  dueDate: string | null;
  submissions: number;
  ungraded: number;
};

export type SubmissionGradeRow = {
  id: string;
  studentIdCode: string;
  studentName: string;
  submittedAt: string;
  fileUrl: string | null;
  grade: string | null;
  feedback: string | null;
};
