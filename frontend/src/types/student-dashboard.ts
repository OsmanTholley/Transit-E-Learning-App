import { NewUpload, StudentAssignment, StudentCourse, StudentLectureNote } from "@/services/student-dashboard-data";

export type StudentDashboardProfile = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  program: string;
  year: string;
  semester: string;
  avatarInitials: string;
  profileImage: string | null;
  role: string;
};

export type StudentDashboardStats = {
  activeCourses: number;
  assignmentsDue: number;
  quizAverage: number;
  newNotifications: number;
};

export type StudentDashboardData = {
  profile: StudentDashboardProfile;
  stats: StudentDashboardStats;
  courses: StudentCourse[];
  upcomingAssignments: StudentAssignment[];
  recentLectureNotes: StudentLectureNote[];
  newUploads: NewUpload[];
};
