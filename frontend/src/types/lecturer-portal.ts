export type LecturerDashboardData = {
  lecturerName: string;
  stats: {
    coursesManaged: number;
    pendingGrading: number;
    notesUploaded: number;
    quizzesCreated: number;
    assignmentsCount: number;
  };
  recentCourses: {
    id: string;
    code: string;
    title: string;
    students: number;
    updatedAt: string;
  }[];
};

export type LecturerCourseRow = {
  id: string;
  code: string;
  title: string;
  department: string;
  program: string;
  semester: string;
  level: string;
  students: number;
  description: string | null;
  learningOutcomes: string[];
  syllabusUrl: string | null;
  updatedAt: string;
};

export type LecturerCoursesData = {
  courses: LecturerCourseRow[];
};

export type LecturerAdminDetail = {
  lecturer: import("@/types/lecturer").LecturerRecord;
  courseList: { code: string; title: string; students: number }[];
  materials: { title: string; course: string; type: string }[];
  stats: {
    quizzesCreated: number;
    quizAttempts: number;
    assignmentsCount: number;
    gradedSubmissions: number;
    totalSubmissions: number;
    lectureNotes: number;
    videos: number;
    gradedPct: number;
  };
};
