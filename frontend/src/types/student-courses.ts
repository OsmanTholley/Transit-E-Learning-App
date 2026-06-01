export type CourseCard = {
  id: string;
  title: string;
  code: string;
  description: string | null;
  semester: string | null;
  level: string | null;
  department: string;
  program: string;
  lecturerName: string;
  lecturerSpecialization: string | null;
  progress: number;
  completed: boolean;
  isCurrentSemester: boolean;
  thumbnail: string;
  thumbnailBg: string;
  stats: {
    lectureNotes: number;
    videos: number;
    assignments: number;
    quizzes: number;
  };
};

export type CoursesOverviewStats = {
  totalCourses: number;
  completedCourses: number;
  pendingAssignments: number;
  averageQuizScore: number;
};

export type CoursesListResponse = {
  courses: CourseCard[];
  stats: CoursesOverviewStats;
  profile: {
    semester: string | null;
    level: string | null;
    department: string;
    program: string;
  };
};

export type LectureNoteItem = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  lecturerName: string;
  fileType: string;
  fileUrl: string;
  description: string | null;
  uploadedAt: string;
};

export type VideoItem = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  progress: number;
};

export type AssignmentItem = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  instructions: string | null;
  dueDate: string | null;
  status: "submitted" | "pending" | "late";
  marks: string | null;
  feedback: string | null;
  submittedAt: string | null;
};

export type QuizItem = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  durationMinutes: number | null;
  totalMarks: number | null;
  questionCount: number;
  bestScore: number | null;
  attempted: boolean;
};

export type DiscussionItem = {
  id: string;
  title: string;
  message: string;
  courseTitle: string | null;
  authorName: string;
  type: string;
  createdAt: string;
  commentCount: number;
};

export type CourseDetail = CourseCard & {
  objectives: string[];
  announcements: { id: string; title: string; message: string; createdAt: string }[];
  lectureNotes: LectureNoteItem[];
  videos: VideoItem[];
  assignments: AssignmentItem[];
  quizzes: QuizItem[];
  discussions: DiscussionItem[];
  progressBreakdown: {
    lessonsCompleted: number;
    lessonsTotal: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    quizzesCompleted: number;
    quizzesTotal: number;
  };
};
