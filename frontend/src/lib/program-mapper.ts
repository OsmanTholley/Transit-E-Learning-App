import { AcademicStatus, ProgramRecord } from "@/types/academic";

type ProgramWithRelations = {
  id: string;
  programName: string;
  duration: string | null;
  departmentId: string | null;
  createdAt: Date;
  department: { departmentName: string } | null;
  _count: { students: number; courses: number };
};

function deriveProgramStatus(counts: { students: number; courses: number }): AcademicStatus {
  if (counts.students === 0 && counts.courses === 0) {
    return "Pending";
  }
  return "Active";
}

export function mapProgramToRecord(program: ProgramWithRelations): ProgramRecord {
  return {
    id: program.id,
    name: program.programName,
    department: program.department?.departmentName ?? "—",
    departmentId: program.departmentId,
    duration: program.duration ?? "—",
    totalStudents: program._count.students,
    totalCourses: program._count.courses,
    status: deriveProgramStatus(program._count),
  };
}
