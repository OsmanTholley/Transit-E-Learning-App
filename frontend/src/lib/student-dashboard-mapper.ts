import { formatAcademicYear } from "@/lib/academic-years";
import {
  NewUpload,
  StudentAssignment,
  StudentCourse,
  StudentLectureNote,
} from "@/services/student-dashboard-data";
import { StudentDashboardData, StudentDashboardStats } from "@/types/student-dashboard";

const thumbnailStyles = [
  { thumbnail: "code",        thumbnailBg: "from-violet-600 via-indigo-600 to-blue-700" },
  { thumbnail: "database",    thumbnailBg: "from-sky-500 via-blue-600 to-indigo-700" },
  { thumbnail: "engineering", thumbnailBg: "from-emerald-500 via-teal-600 to-cyan-700" },
  { thumbnail: "math",        thumbnailBg: "from-amber-500 via-orange-500 to-rose-600" },
] as const;

function pickThumbnail(index: number) {
  return thumbnailStyles[index % thumbnailStyles.length];
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function lecturerInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type DashboardStudent = {
  id: string;
  studentId: string;
  profileImage: string | null;
  level: string | null;
  semester: string | null;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    profileImage: string | null;
  };
  department: { departmentName: string } | null;
  program: { programName: string } | null;
  accessibleCourses?: {
    id: string;
    courseTitle: string;
    courseCode: string;
    assignments: { id: string }[];
    quizzes: { id: string }[];
  }[];
  courseStudents: {
    course: {
      id: string;
      courseTitle: string;
      courseCode: string;
      assignments: { id: string }[];
      quizzes: { id: string }[];
    };
  }[];
  submissions: { assignmentId: string }[];
  quizAttempts: { quizId: string; score: number | null }[];
};

type AssignmentRow = {
  id: string;
  title: string | null;
  dueDate: Date | null;
  course: { courseTitle: string };
};

type LectureNoteRow = {
  id: string;
  title: string;
  fileType: string | null;
  createdAt: Date;
  course: { courseTitle: string; courseCode: string };
  lecturer: { user: { fullName: string } } | null;
};

type VideoRow = {
  id: string;
  title: string | null;
  createdAt: Date;
  course: { courseTitle: string; courseCode: string };
  lecturer: { user: { fullName: string } } | null;
};

export function courseProgress(
  course: { assignments: { id: string }[]; quizzes: { id: string }[] },
  submissions: { assignmentId: string }[],
  quizAttempts: { quizId: string; score: number | null }[]
) {
  const submittedAssignmentIds = new Set(submissions.map((s) => s.assignmentId));
  const attemptedQuizIds = new Set(quizAttempts.filter((a) => a.score != null).map((a) => a.quizId));

  let total = 0;
  let done = 0;

  for (const assignment of course.assignments) {
    total += 1;
    if (submittedAssignmentIds.has(assignment.id)) done += 1;
  }
  for (const quiz of course.quizzes) {
    total += 1;
    if (attemptedQuizIds.has(quiz.id)) done += 1;
  }

  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function buildStudentDashboardData(
  student: DashboardStudent,
  assignments: AssignmentRow[],
  lectureNotes: LectureNoteRow[],
  videos: VideoRow[],
  unreadNotifications: number,
  quizAverage: number
): StudentDashboardData {
  const initials = student.user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const submittedIds = new Set(student.submissions.map((s) => s.assignmentId));

  const courseRows =
    student.accessibleCourses ??
    student.courseStudents.map((enrollment) => enrollment.course);

  const courses: StudentCourse[] = courseRows.map((course, index) => {
    const style = pickThumbnail(index);
    return {
      id: course.id,
      title: course.courseTitle,
      code: course.courseCode,
      progress: courseProgress(course, student.submissions, student.quizAttempts),
      thumbnail: style.thumbnail,
      thumbnailBg: style.thumbnailBg,
    };
  });

  const now = new Date();
  const upcomingAssignments: StudentAssignment[] = assignments
    .filter((a) => !submittedIds.has(a.id))
    .filter((a) => !a.dueDate || a.dueDate >= now)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    })
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: a.title ?? "Untitled Assignment",
      course: a.course.courseTitle,
      dueDate: a.dueDate ? formatDate(a.dueDate) : "No due date",
      type: "pdf" as const,
    }));

  const recentLectureNotes: StudentLectureNote[] = lectureNotes.slice(0, 5).map((note) => ({
    id: note.id,
    title: note.title,
    course: note.course.courseTitle,
    format: (note.fileType ?? "PDF").toUpperCase(),
  }));

  /* ── Build unified NEW UPLOADS feed (notes + videos, sorted by recency) ── */
  const noteUploads: NewUpload[] = lectureNotes.map((note) => {
    const name = note.lecturer?.user.fullName ?? "Lecturer";
    return {
      id: `note-${note.id}`,
      type: "note",
      title: note.title,
      course: note.course.courseTitle,
      courseCode: note.course.courseCode,
      lecturerName: name,
      lecturerInitials: lecturerInitials(name),
      uploadedAt: note.createdAt.toISOString(),
      href: `/student/lecture-notes/view/${note.id}`,
    };
  });

  const videoUploads: NewUpload[] = videos.map((video) => {
    const name = video.lecturer?.user.fullName ?? "Lecturer";
    return {
      id: `video-${video.id}`,
      type: "video",
      title: video.title ?? "Untitled Video",
      course: video.course.courseTitle,
      courseCode: video.course.courseCode,
      lecturerName: name,
      lecturerInitials: lecturerInitials(name),
      uploadedAt: video.createdAt.toISOString(),
      href: `/student/video-lessons`,
    };
  });

  const newUploads: NewUpload[] = [...noteUploads, ...videoUploads]
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 8);

  const stats: StudentDashboardStats = {
    activeCourses: courses.length,
    assignmentsDue: upcomingAssignments.length,
    quizAverage,
    newNotifications: unreadNotifications,
  };

  return {
    profile: {
      id: student.id,
      userId: student.user.id,
      fullName: student.user.fullName,
      email: student.user.email ?? "",
      studentId: student.studentId,
      department: student.department?.departmentName ?? "—",
      program: student.program?.programName ?? "—",
      year: formatAcademicYear(student.level),
      semester: student.semester ?? "—",
      avatarInitials: initials || "ST",
      profileImage: student.profileImage ?? student.user.profileImage ?? null,
      role: "Student",
    },
    stats,
    courses,
    upcomingAssignments,
    recentLectureNotes,
    newUploads,
  };
}
