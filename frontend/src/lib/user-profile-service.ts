import { courseProgress } from "@/lib/student-dashboard-mapper";
import {
  adminPermissions,
  avatarInitials,
  emptyToDash,
  formatProfileDate,
} from "@/lib/user-profile-helpers";
import { prisma } from "@/lib/prisma";
import type {
  AdminProfilePayload,
  BaseProfileFields,
  LecturerProfilePayload,
  ProfileActivityItem,
  ProfileGradeItem,
  StudentProfilePayload,
} from "@/types/user-profile";

function baseFields(user: {
  fullName: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  learningGoals: string | null;
  socialLinks: string | null;
  achievements: string | null;
  lastLoginAt: Date | null;
  profileImage?: string | null;
}): BaseProfileFields {
  return {
    fullName: user.fullName,
    email: user.email ?? "—",
    phone: emptyToDash(user.phone),
    bio: emptyToDash(user.bio),
    socialLinks: emptyToDash(user.socialLinks),
    learningGoals: emptyToDash(user.learningGoals),
    achievements: emptyToDash(user.achievements),
    profileImage: user.profileImage ?? null,
    avatarInitials: avatarInitials(user.fullName),
    lastLoginAt: formatProfileDate(user.lastLoginAt),
  };
}

export async function loadStudentProfile(userId: string): Promise<StudentProfilePayload | null> {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      department: true,
      program: true,
      courseStudents: {
        include: {
          course: {
            include: {
              assignments: { select: { id: true } },
              quizzes: { select: { id: true } },
            },
          },
        },
      },
      submissions: {
        include: { assignment: { include: { course: { select: { courseTitle: true } } } } },
        orderBy: { submittedAt: "desc" },
        take: 8,
      },
      quizAttempts: {
        include: { quiz: { include: { course: { select: { courseTitle: true } } } } },
        orderBy: { submittedAt: "desc" },
        take: 8,
      },
    },
  });

  if (!student) return null;

  const profileImage = student.profileImage ?? student.user.profileImage ?? null;

  const enrolledCourses = student.courseStudents.map((enrollment) => ({
    id: enrollment.course.id,
    code: enrollment.course.courseCode,
    title: enrollment.course.courseTitle,
    progress: courseProgress(
      enrollment.course,
      student.submissions,
      student.quizAttempts
    ),
  }));

  const recentActivity: ProfileActivityItem[] = [];
  if (student.user.lastLoginAt) {
    recentActivity.push({
      label: "Last sign-in",
      detail: "Successful login",
      at: formatProfileDate(student.user.lastLoginAt) ?? "—",
    });
  }

  for (const submission of student.submissions.slice(0, 5)) {
    recentActivity.push({
      label: "Assignment submitted",
      detail: submission.assignment.title ?? "Assignment",
      at: formatProfileDate(submission.submittedAt) ?? "—",
    });
  }

  const grades: ProfileGradeItem[] = [];

  for (const submission of student.submissions) {
    if (!submission.grade) continue;
    grades.push({
      id: submission.id,
      title: submission.assignment.title ?? "Assignment",
      course: submission.assignment.course.courseTitle,
      type: "assignment",
      score: submission.grade,
      status: "graded",
      at: formatProfileDate(submission.submittedAt) ?? "—",
    });
  }

  for (const attempt of student.quizAttempts) {
    if (attempt.score == null) continue;
    grades.push({
      id: attempt.id,
      title: attempt.quiz.title ?? "Quiz",
      course: attempt.quiz.course?.courseTitle ?? "—",
      type: "quiz",
      score: `${attempt.score}%`,
      status: "graded",
      at: formatProfileDate(attempt.submittedAt) ?? "—",
    });
  }

  grades.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    role: "student",
    profile: {
      ...baseFields({ ...student.user, profileImage }),
      studentId: student.studentId,
      department: student.department?.departmentName ?? "—",
      program: student.program?.programName ?? "—",
      year: student.level ?? "—",
      semester: student.semester ?? "—",
    },
    enrolledCourses,
    recentActivity,
    grades: grades.slice(0, 12),
  };
}

export async function loadLecturerProfile(userId: string): Promise<LecturerProfilePayload | null> {
  const lecturer = await prisma.lecturer.findUnique({
    where: { userId },
    include: {
      user: true,
      courses: {
        select: {
          id: true,
          courseCode: true,
          courseTitle: true,
          department: { select: { departmentName: true } },
        },
        orderBy: { courseCode: "asc" },
      },
    },
  });

  if (!lecturer) return null;

  const profileImage = lecturer.profileImage ?? lecturer.user.profileImage ?? null;
  const departmentNames = [
    ...new Set(
      lecturer.courses.map((c) => c.department?.departmentName).filter((n): n is string => Boolean(n))
    ),
  ];

  return {
    role: "lecturer",
    profile: {
      ...baseFields({ ...lecturer.user, profileImage }),
      specialization: emptyToDash(lecturer.specialization),
      department: departmentNames.length ? departmentNames.join(", ") : "—",
    },
    coursesTeaching: lecturer.courses.map((course) => ({
      id: course.id,
      code: course.courseCode,
      title: course.courseTitle,
    })),
  };
}

export async function loadAdminProfile(userId: string): Promise<AdminProfilePayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { admin: true },
  });

  if (!user?.admin) return null;

  return {
    role: "admin",
    profile: {
      ...baseFields(user),
      adminLevel: emptyToDash(user.admin.adminLevel),
      permissions: adminPermissions(user.admin.adminLevel),
    },
  };
}

export async function patchUserProfileFields(
  userId: string,
  data: {
    fullName?: string;
    phone?: string | null;
    bio?: string | null;
    socialLinks?: string | null;
    learningGoals?: string | null;
    achievements?: string | null;
    profileImage?: string | null;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.fullName?.trim() ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
      ...(data.bio !== undefined ? { bio: data.bio?.trim() || null } : {}),
      ...(data.socialLinks !== undefined ? { socialLinks: data.socialLinks?.trim() || null } : {}),
      ...(data.learningGoals !== undefined ? { learningGoals: data.learningGoals?.trim() || null } : {}),
      ...(data.achievements !== undefined ? { achievements: data.achievements?.trim() || null } : {}),
      ...(data.profileImage !== undefined ? { profileImage: data.profileImage } : {}),
    },
  });
}
