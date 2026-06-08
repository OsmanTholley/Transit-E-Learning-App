export type AcademicStatus = "Active" | "Pending" | "Archived" | "Inactive";

export type ProgramRecord = {
  id: string;
  name: string;
  department: string;
  departmentId?: string | null;
  duration: string;
  totalStudents: number;
  totalCourses: number;
  status: AcademicStatus;
};

export type CourseRecord = {
  id: string;
  code: string;
  title: string;
  department: string;
  program: string;
  lecturer: string;
  level: string;
  semester: string;
  totalStudents: number;
  status: AcademicStatus;
  description?: string | null;
};

export type ContentItem = {
  id: string;
  title: string;
  type: string;
  course: string;
  department: string;
  lecturer: string;
  uploadedAt: string;
  status: "Approved" | "Pending" | "Rejected" | "Archived";
  /** For materials/videos with comments & likes */
  socialTarget?: "lecture-note" | "video";
  /** Admin CRUD target slug */
  contentTarget?: "lecture-note" | "video" | "assignment" | "quiz" | "discussion";
};

export type ReportedContent = {
  id: string;
  contentTitle: string;
  reportedBy: string;
  reason: string;
  date: string;
  status: "Open" | "Resolved" | "Dismissed";
};
