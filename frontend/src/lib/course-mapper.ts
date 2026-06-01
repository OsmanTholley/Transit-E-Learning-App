import { formatAcademicYear } from "@/lib/academic-years";
import { AcademicStatus, CourseRecord } from "@/types/academic";

type CourseWithRelations = {
  id: string;
  courseCode: string;
  courseTitle: string;
  level: string | null;
  semester: string | null;
  lecturerId: string | null;
  department: { departmentName: string } | null;
  program: { programName: string } | null;
  lecturer: { user: { fullName: string } } | null;
  _count: { courseStudents: number };
};

function deriveCourseStatus(lecturerId: string | null): AcademicStatus {
  return lecturerId ? "Active" : "Pending";
}

export function mapCourseToRecord(course: CourseWithRelations): CourseRecord {
  return {
    id: course.id,
    code: course.courseCode,
    title: course.courseTitle,
    department: course.department?.departmentName ?? "—",
    program: course.program?.programName ?? "—",
    lecturer: course.lecturer?.user.fullName ?? "—",
    level: formatAcademicYear(course.level) ?? "—",
    semester: course.semester ?? "—",
    totalStudents: course._count.courseStudents,
    status: deriveCourseStatus(course.lecturerId),
  };
}
