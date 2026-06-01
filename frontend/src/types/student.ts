export type StudentAccountStatus = "Active" | "Suspended" | "Pending";

export type StudentRecord = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  program: string;
  year: string;
  semester: string;
  admissionYear: string;
  status: StudentAccountStatus;
  registeredAt: string;
  avatarInitials: string;
};

export type VerificationLog = {
  id: string;
  studentId: string;
  fullName: string;
  action: "Approved" | "Rejected" | "Pending";
  timestamp: string;
  note?: string;
};

export type AttendanceRecord = {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  date: string;
  status: "Present" | "Absent" | "Late";
};

export type StudentNotification = {
  id: string;
  title: string;
  audience: string;
  sentAt: string;
  status: "Sent" | "Scheduled" | "Draft";
};
