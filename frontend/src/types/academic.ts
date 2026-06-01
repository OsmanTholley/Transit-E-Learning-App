export type AcademicStatus = "Active" | "Pending" | "Archived" | "Inactive";

export type ProgramRecord = {
  id: string;
  name: string;
  department: string;
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
};

export type ReportedContent = {
  id: string;
  contentTitle: string;
  reportedBy: string;
  reason: string;
  date: string;
  status: "Open" | "Resolved" | "Dismissed";
};
