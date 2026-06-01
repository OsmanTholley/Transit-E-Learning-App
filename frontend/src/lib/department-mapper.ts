import { DepartmentRecord, DepartmentStatus } from "@/types/department";

type DepartmentWithRelations = {
  id: string;
  departmentName: string;
  description: string | null;
  createdAt: Date;
  _count: {
    programs: number;
    students: number;
    courses: number;
  };
  courses: { lecturerId: string | null }[];
};

function departmentCode(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
  return name.slice(0, 2).toUpperCase();
}

function deriveDepartmentStatus(counts: {
  programs: number;
  students: number;
  courses: number;
}): DepartmentStatus {
  if (counts.programs === 0 && counts.students === 0 && counts.courses === 0) {
    return "Pending";
  }
  return "Active";
}

export function mapDepartmentToRecord(department: DepartmentWithRelations): DepartmentRecord {
  const lecturerIds = new Set(
    department.courses.map((c) => c.lecturerId).filter((id): id is string => Boolean(id)),
  );

  return {
    id: department.id,
    name: department.departmentName,
    code: departmentCode(department.departmentName),
    description: department.description ?? "",
    head: "—",
    totalPrograms: department._count.programs,
    totalStudents: department._count.students,
    totalLecturers: lecturerIds.size,
    totalCourses: department._count.courses,
    status: deriveDepartmentStatus(department._count),
    createdAt: department.createdAt.toISOString().slice(0, 10),
  };
}
