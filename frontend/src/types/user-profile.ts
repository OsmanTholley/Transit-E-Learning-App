export type ProfileCourseItem = {
  id: string;
  code: string;
  title: string;
  progress?: number;
};

export type ProfileActivityItem = {
  label: string;
  detail: string;
  at: string;
};

export type ProfileGradeItem = {
  id: string;
  title: string;
  course: string;
  type: "assignment" | "quiz";
  score: string;
  status: "graded" | "pending";
  at: string;
};

export type BaseProfileFields = {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  socialLinks: string;
  learningGoals: string;
  achievements: string;
  profileImage: string | null;
  avatarInitials: string;
  lastLoginAt: string | null;
};

export type StudentProfilePayload = {
  role: "student";
  profile: BaseProfileFields & {
    studentId: string;
    department: string;
    program: string;
    year: string;
    semester: string;
  };
  enrolledCourses: ProfileCourseItem[];
  recentActivity: ProfileActivityItem[];
  grades: ProfileGradeItem[];
};

export type LecturerProfilePayload = {
  role: "lecturer";
  profile: BaseProfileFields & {
    specialization: string;
    department: string;
  };
  coursesTeaching: ProfileCourseItem[];
};

export type AdminProfilePayload = {
  role: "admin";
  profile: BaseProfileFields & {
    adminLevel: string;
    permissions: string[];
  };
};

export type UserProfilePayload = StudentProfilePayload | LecturerProfilePayload | AdminProfilePayload;

export type ProfileEditInput = {
  fullName?: string;
  phone?: string;
  bio?: string;
  socialLinks?: string;
  learningGoals?: string;
  achievements?: string;
  profileImage?: string | null;
  specialization?: string;
};
