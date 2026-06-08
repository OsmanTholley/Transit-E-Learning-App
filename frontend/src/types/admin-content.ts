/** Admin content target slugs used in `/api/admin/content/[targetType]/…` */
export type AdminContentTarget =
  | "lecture-note"
  | "video"
  | "assignment"
  | "quiz"
  | "discussion";

/** Fields editable via PATCH for lecture notes */
export type AdminLectureNoteUpdate = {
  title?: string;
  description?: string | null;
  fileUrl?: string;
  fileType?: string | null;
  coverImageUrl?: string | null;
  courseId?: string;
  lecturerId?: string | null;
};

/** Fields editable via PATCH for videos */
export type AdminVideoUpdate = {
  title?: string | null;
  videoUrl?: string;
  thumbnailUrl?: string | null;
  duration?: string | null;
  expiresAt?: string | null;
  deletionNotice?: string | null;
  courseId?: string;
  lecturerId?: string | null;
};

/** Fields editable via PATCH for assignments */
export type AdminAssignmentUpdate = {
  title?: string | null;
  instructions?: string | null;
  attachmentUrl?: string | null;
  dueDate?: string | null;
  courseId?: string;
  lecturerId?: string | null;
};

/** Single quiz question (create or replace) */
export type AdminQuizQuestionInput = {
  id?: string;
  question: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer?: string | null;
  marks?: number;
};

/** Fields editable via PATCH for quizzes */
export type AdminQuizUpdate = {
  title?: string | null;
  instructions?: string | null;
  durationMinutes?: number | null;
  totalMarks?: number | null;
  courseId?: string;
  lecturerId?: string | null;
  /** When provided, replaces all quiz questions */
  questions?: AdminQuizQuestionInput[];
};

/** Fields editable via PATCH for discussions */
export type AdminDiscussionUpdate = {
  title?: string | null;
  message?: string | null;
  discussionType?: "COURSE" | "PROGRAM" | "GENERAL";
  courseId?: string | null;
  studentId?: string | null;
};

/** Union accepted by PATCH body (target comes from URL) */
export type AdminContentUpdateBody =
  | AdminLectureNoteUpdate
  | AdminVideoUpdate
  | AdminAssignmentUpdate
  | AdminQuizUpdate
  | AdminDiscussionUpdate;

/** Create payloads (POST `/api/admin/content/[targetType]`) */
export type AdminLectureNoteCreate = {
  courseId: string;
  lecturerId?: string | null;
  title: string;
  fileUrl: string;
  fileType?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
};

export type AdminVideoCreate = {
  courseId: string;
  lecturerId?: string | null;
  title?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration?: string | null;
  expiresAt?: string | null;
  deletionNotice?: string | null;
};

export type AdminAssignmentCreate = {
  courseId: string;
  lecturerId?: string | null;
  title?: string | null;
  instructions?: string | null;
  attachmentUrl?: string | null;
  dueDate?: string | null;
};

export type AdminQuizCreate = {
  courseId: string;
  lecturerId?: string | null;
  title?: string | null;
  instructions?: string | null;
  durationMinutes?: number | null;
  questions: AdminQuizQuestionInput[];
};

export type AdminDiscussionCreate = {
  courseId?: string | null;
  studentId?: string | null;
  title?: string | null;
  message?: string | null;
  discussionType?: "COURSE" | "PROGRAM" | "GENERAL";
};

/** GET detail responses — use these to populate edit forms */
export type AdminLectureNoteDetail = {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string | null;
  lecturerName: string | null;
  title: string;
  fileUrl: string;
  fileType: string | null;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: string;
};

export type AdminVideoDetail = {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string | null;
  lecturerName: string | null;
  title: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  expiresAt: string | null;
  deletionNotice: string | null;
  createdAt: string;
};

export type AdminAssignmentDetail = {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string | null;
  lecturerName: string | null;
  title: string | null;
  instructions: string | null;
  attachmentUrl: string | null;
  dueDate: string | null;
  createdAt: string;
};

export type AdminQuizDetail = {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string | null;
  lecturerName: string | null;
  title: string | null;
  instructions: string | null;
  durationMinutes: number | null;
  totalMarks: number | null;
  createdAt: string;
  questions: {
    id: string;
    question: string;
    optionA: string | null;
    optionB: string | null;
    optionC: string | null;
    optionD: string | null;
    correctAnswer: string | null;
    marks: number;
  }[];
};

export type AdminDiscussionDetail = {
  id: string;
  courseId: string | null;
  courseCode: string | null;
  courseTitle: string | null;
  studentId: string | null;
  studentName: string | null;
  title: string | null;
  message: string | null;
  discussionType: "COURSE" | "PROGRAM" | "GENERAL";
  createdAt: string;
};

export type AdminContentDetail =
  | AdminLectureNoteDetail
  | AdminVideoDetail
  | AdminAssignmentDetail
  | AdminQuizDetail
  | AdminDiscussionDetail;

/** PATCH success response */
export type AdminContentUpdateResponse = {
  message: string;
  item: AdminContentDetail;
};
