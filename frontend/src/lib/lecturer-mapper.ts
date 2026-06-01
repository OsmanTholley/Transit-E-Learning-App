import { LecturerRecord, LecturerAccountStatus, LecturerVerificationStatus } from "@/types/lecturer";

type LecturerWithRelations = {
  id: string;
  specialization: string | null;
  isVerified: boolean;
  createdAt: Date;
  user: {
    fullName: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
  };
  courses: {
    courseCode: string;
    department?: { departmentName: string } | null;
  }[];
};

export function mapLecturerToRecord(lecturer: LecturerWithRelations): LecturerRecord {
  const initials = lecturer.user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  let verificationStatus: LecturerVerificationStatus = "Pending";
  if (lecturer.isVerified) {
    verificationStatus = "Verified";
  }

  let accountStatus: LecturerAccountStatus = "Active";
  if (!lecturer.user.isActive) {
    accountStatus = "Suspended";
  }

  const departmentNames = [
    ...new Set(
      lecturer.courses.map((c) => c.department?.departmentName).filter((name): name is string => Boolean(name)),
    ),
  ];

  return {
    id: lecturer.id,
    fullName: lecturer.user.fullName,
    email: lecturer.user.email ?? "",
    phone: lecturer.user.phone ?? "",
    department: departmentNames.length ? departmentNames.join(", ") : "—",
    assignedCourses: lecturer.courses.map((c) => c.courseCode).join(", ") || "—",
    specialization: lecturer.specialization ?? "—",
    verificationStatus,
    accountStatus,
    registeredAt: lecturer.createdAt.toISOString().slice(0, 10),
    avatarInitials: initials || "LC",
  };
}
