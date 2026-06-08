import { normalizeAcademicYear } from "@/lib/academic-years";
import { semestersMatch } from "@/lib/academic-semesters";
import { courseProgress } from "@/lib/student-dashboard-mapper";

const thumbnailStyles = [
  { thumbnail: "code", thumbnailBg: "from-violet-600 via-indigo-600 to-blue-700" },
  { thumbnail: "database", thumbnailBg: "from-sky-500 via-blue-600 to-indigo-700" },
  { thumbnail: "engineering", thumbnailBg: "from-emerald-500 via-teal-600 to-cyan-700" },
  { thumbnail: "math", thumbnailBg: "from-amber-500 via-orange-500 to-rose-600" },
] as const;

export function pickThumbnail(index: number) {
  return thumbnailStyles[index % thumbnailStyles.length];
}

export function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type StudentProfile = {
  departmentId: string | null;
  programId: string | null;
  level: string | null;
  semester: string | null;
};

export type CourseMatchInput = {
  id: string;
  departmentId: string | null;
  programId: string | null;
  level: string | null;
  semester: string | null;
};

type CourseRow = CourseMatchInput & {
  courseTitle: string;
  courseCode: string;
  description: string | null;
  department: { departmentName: string } | null;
  program: { programName: string } | null;
  lecturer: {
    user: { fullName: string };
    specialization: string | null;
  } | null;
  assignments: { id: string; dueDate: Date | null }[];
  quizzes: { id: string }[];
  lectureNotes: { id: string }[];
  videos: { id: string }[];
};

export function courseMatchesStudentProfile(course: CourseMatchInput, student: StudentProfile) {
  if (student.departmentId && course.departmentId && course.departmentId !== student.departmentId) {
    return false;
  }
  if (student.programId && course.programId && course.programId !== student.programId) {
    return false;
  }
  const studentYear = normalizeAcademicYear(student.level);
  const courseYear  = normalizeAcademicYear(course.level);
  if (studentYear && courseYear && courseYear !== studentYear) {
    return false;
  }
  if (student.semester && course.semester && !semestersMatch(student.semester, course.semester)) {
    return false;
  }
  return true;
}

export function mapCourseCard(
  course: CourseRow,
  index: number,
  submissions: { assignmentId: string }[],
  quizAttempts: { quizId: string; score: number | null }[]
) {
  const style = pickThumbnail(index);
  const progress = courseProgress(course, submissions, quizAttempts);
  return {
    id: course.id,
    title: course.courseTitle,
    code: course.courseCode,
    description: course.description,
    semester: course.semester,
    level: course.level,
    department: course.department?.departmentName ?? "—",
    program: course.program?.programName ?? "—",
    lecturerName: course.lecturer?.user.fullName ?? "TBA",
    lecturerSpecialization: course.lecturer?.specialization ?? null,
    progress,
    completed: progress >= 100,
    isCurrentSemester: true,
    thumbnail: style.thumbnail,
    thumbnailBg: style.thumbnailBg,
    stats: {
      lectureNotes: course.lectureNotes.length,
      videos: course.videos.length,
      assignments: course.assignments.length,
      quizzes: course.quizzes.length,
    },
  };
}

export function computeCourseStats(
  courses: { progress: number; completed: boolean; stats: { assignments: number; quizzes: number } }[],
  pendingAssignments: number,
  quizAverage: number
) {
  return {
    totalCourses: courses.length,
    completedCourses: courses.filter((c) => c.completed).length,
    pendingAssignments,
    averageQuizScore: quizAverage,
  };
}
