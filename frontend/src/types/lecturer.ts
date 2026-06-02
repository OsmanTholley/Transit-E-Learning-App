export type LecturerAccountStatus = "Active" | "Suspended" | "Pending";
export type LecturerVerificationStatus = "Verified" | "Pending" | "Rejected";

export type LecturerRecord = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  assignedCourses: string;
  specialization: string;
  verificationStatus: LecturerVerificationStatus;
  accountStatus: LecturerAccountStatus;
  registeredAt: string;
  avatarInitials: string;
};

export type LecturerVerificationLog = {
  id: string;
  email: string;
  fullName: string;
  department: string;
  action: "Approved" | "Rejected" | "Pending";
  timestamp: string;
  note?: string;
};

export type UploadedMaterial = {
  id: string;
  lecturerName: string;
  type: "Lecture Note" | "Video" | "Assignment" | "Quiz";
  title: string;
  course: string;
  uploadedAt: string;
  status: "Approved" | "Pending" | "Rejected";
};

export type LecturerNotification = {
  id: string;
  title: string;
  audience: string;
  sentAt: string;
  status: "Sent" | "Scheduled" | "Draft";
};
