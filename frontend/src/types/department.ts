export type DepartmentStatus = "Active" | "Inactive" | "Pending";

export type DepartmentRecord = {
  id: string;
  name: string;
  code: string;
  description: string;
  head: string;
  totalPrograms: number;
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  status: DepartmentStatus;
  createdAt: string;
};

export type ProgramRecord = {
  id: string;
  name: string;
  department: string;
  duration: string;
  levels: string;
  status: DepartmentStatus;
};

export type DepartmentNotification = {
  id: string;
  title: string;
  audience: string;
  sentAt: string;
  status: "Sent" | "Scheduled" | "Draft";
};
