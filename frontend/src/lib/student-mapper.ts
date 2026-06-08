import { formatAcademicYear } from "@/lib/academic-years";
import { StudentRecord, StudentAccountStatus } from "@/types/student";

type StudentWithRelations = {
  id: string;
  studentId: string;
  level: string | null;
  gender?: string | null;
  admissionYear: string | null;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
  };
  department: { departmentName: string } | null;
  program: { programName: string } | null;
};

export function mapStudentToRecord(student: StudentWithRelations): StudentRecord {
  const initials = student.user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  let status: StudentAccountStatus = "Active";
  if (!student.user.isActive) {
    status = "Suspended";
  }

  return {
    id: student.id,
    studentId: student.studentId,
    fullName: student.user.fullName,
    email: student.user.email ?? "",
    phone: student.user.phone ?? "",
    department: student.department?.departmentName ?? "—",
    program: student.program?.programName ?? "—",
    year: formatAcademicYear(student.level),
    gender: student.gender ?? "—",
    admissionYear: student.admissionYear ?? "—",
    status,
    registeredAt: student.createdAt.toISOString().slice(0, 10),
    avatarInitials: initials || "ST",
  };
}
