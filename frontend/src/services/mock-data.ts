import { contentSubmenu } from "@/services/content-management-data";
import { departmentSubmenu } from "@/services/department-management-data";
import { lecturerSubmenu } from "@/services/lecturer-management-data";
import { coursesSubmenu, programSubmenu } from "@/services/academic-data";
import { studentSubmenu } from "@/services/student-management-data";
import { AdminNavigation, NavItem, SectionContent } from "@/types/app";

export const navigation: Record<"student" | "lecturer", NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "My Courses", href: "/student/courses" },
    { label: "Lecture Notes", href: "/student/lecture-notes" },
    { label: "Video Lessons", href: "/student/videos" },
    { label: "Assignments", href: "/student/assignments" },
    { label: "Quizzes", href: "/student/quizzes" },
    { label: "Discussions", href: "/student/discussions" },
    { label: "AI Tutor", href: "/student/ai-tutor" },
    { label: "Notifications", href: "/student/notifications" },
    { label: "Profile", href: "/student/profile" },
    { label: "Settings", href: "/student/settings" },
  ],
  lecturer: [
    { label: "Dashboard", href: "/lecturer/dashboard" },
    { label: "Courses", href: "/lecturer/courses" },
    { label: "Live Classroom", href: "/lecturer/live-classroom" },
    { label: "Upload Note", href: "/lecturer/upload-note" },
    { label: "Quizzes", href: "/lecturer/quizzes" },
    { label: "Assignments", href: "/lecturer/assignments" },
    { label: "Profile", href: "/lecturer/profile" },
  ],
};

export const adminNavigation: AdminNavigation = {
  dashboard: { label: "Dashboard", href: "/admin/dashboard" },
  categories: [
    {
      label: "Manage",
      items: [
        {
          label: "Students",
          href: "/admin/students/all",
          children: studentSubmenu.map((item) => ({
            label: "sidebarLabel" in item && item.sidebarLabel ? item.sidebarLabel : item.label,
            href: item.href,
          })),
        },
        {
          label: "Lecturers",
          href: "/admin/lecturers/all",
          children: lecturerSubmenu.map((item) => ({ label: item.label, href: item.href })),
        },
        {
          label: "Departments",
          href: "/admin/departments/all",
          children: departmentSubmenu.map((item) => ({ label: item.label, href: item.href })),
        },
        {
          label: "Programs",
          href: "/admin/programs/all",
          children: programSubmenu.map((item) => ({ label: item.label, href: item.href })),
        },
        {
          label: "Courses",
          href: "/admin/courses/all",
          children: coursesSubmenu.map((item) => ({ label: item.label, href: item.href })),
        },
        {
          label: "Manage Content",
          href: "/admin/content/lecture-notes",
          children: contentSubmenu.map((item) => ({ label: item.label, href: item.href })),
        },
      ],
    },
    {
      label: "Learning",
      items: [
        { label: "Assignments", href: "/admin/assignments" },
        { label: "Quizzes", href: "/admin/quizzes" },
        { label: "Live Classroom", href: "/admin/live-classroom" },
        { label: "Discussions", href: "/admin/discussions" },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Announcements", href: "/admin/announcements" },
        { label: "Notifications", href: "/admin/notifications" },
        { label: "Reports & Analytics", href: "/admin/reports" },
        { label: "System Settings", href: "/admin/settings" },
        { label: "Activity Logs", href: "/admin/activity-logs" },
      ],
    },
  ],
};

const studentSections: Record<string, SectionContent> = {
  dashboard: {
    title: "Student Dashboard",
    subtitle: "Track your learning progress and upcoming tasks.",
    stats: [
      { label: "Enrolled Courses", value: "6", trend: "+1 this semester" },
      { label: "Pending Assignments", value: "3", trend: "2 due this week" },
      { label: "Quiz Average", value: "78%", trend: "+6% from last month" },
    ],
    bullets: ["Join discussions daily.", "Review lecture notes before quizzes."],
  },
  courses: {
    title: "My Courses",
    subtitle: "All active courses assigned to your program.",
    table: {
      columns: ["Code", "Title", "Lecturer", "Progress"],
      rows: [
        ["CSC101", "Intro to Programming", "Dr. Ada Lecturer", "65%"],
        ["CSC102", "Database Systems", "Dr. Ada Lecturer", "48%"],
      ],
    },
  },
  assignments: {
    title: "Assignments",
    subtitle: "View deadlines and submit tasks on time.",
    table: {
      columns: ["Course", "Assignment", "Due Date", "Status"],
      rows: [
        ["CSC101", "Variables and Loops", "2026-06-01", "Pending"],
        ["CSC102", "SQL Joins", "2026-06-05", "Submitted"],
      ],
    },
  },
  quizzes: {
    title: "Quizzes",
    subtitle: "Take timed quizzes and monitor your scores.",
    table: {
      columns: ["Course", "Quiz", "Duration", "Score"],
      rows: [
        ["CSC101", "Week 3 Quiz", "20 mins", "82%"],
        ["CSC102", "SQL Basics", "15 mins", "74%"],
      ],
    },
  },
  notifications: {
    title: "Notifications",
    subtitle: "Latest updates from lecturers and administrators.",
    bullets: [
      "New lecture note uploaded for CSC101.",
      "Assignment reminder: SQL Joins due in 2 days.",
      "Campus e-learning maintenance on Sunday 8pm.",
    ],
  },
  "lecture-notes": {
    title: "Lecture Notes",
    subtitle: "Download and review course materials from your lecturers.",
    table: {
      columns: ["Course", "Title", "Format", "Uploaded"],
      rows: [
        ["Database Systems", "Introduction to DBMS", "PDF", "2026-05-20"],
        ["Web Development", "React Hooks Explained", "PDF", "2026-05-22"],
      ],
    },
  },
  videos: {
    title: "Video Lessons",
    subtitle: "Watch recorded lessons and tutorials for your courses.",
    table: {
      columns: ["Course", "Title", "Duration", "Status"],
      rows: [
        ["Web Development", "Intro to React", "45 min", "Watched"],
        ["Database Systems", "SQL Joins Tutorial", "32 min", "New"],
      ],
    },
  },
  discussions: {
    title: "Discussions",
    subtitle: "Participate in course and program discussions.",
    table: {
      columns: ["Topic", "Course", "Replies", "Last Activity"],
      rows: [
        ["Week 5 Q&A", "Web Development", "12", "2026-05-28"],
        ["Assignment Help", "Database Systems", "8", "2026-05-27"],
      ],
    },
  },
  "ai-tutor": {
    title: "AI Tutor",
    subtitle: "Get instant help with your coursework and study questions.",
    bullets: [
      "Ask questions about any enrolled course.",
      "Review past conversations in your chat history.",
      "Use AI suggestions to prepare for quizzes.",
    ],
  },
  profile: {
    title: "Profile",
    subtitle: "View and update your personal and academic information.",
    bullets: ["Student ID: TCSL/001", "Program: BSc Computer Science", "Department: Computing Sciences"],
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your account preferences and security.",
    bullets: ["Change password", "Notification preferences", "Language and accessibility"],
  },
};

const lecturerSections: Record<string, SectionContent> = {
  dashboard: {
    title: "Lecturer Dashboard",
    subtitle: "Monitor classes, content publishing, and grading.",
    stats: [
      { label: "Courses Managed", value: "4" },
      { label: "Pending Grading", value: "28 scripts" },
      { label: "Notes Uploaded", value: "36 files" },
    ],
  },
  courses: {
    title: "Course Management",
    subtitle: "Manage course metadata and learning resources.",
    table: {
      columns: ["Code", "Title", "Students", "Last Update"],
      rows: [
        ["CSC101", "Intro to Programming", "128", "2026-05-25"],
        ["CSC102", "Database Systems", "97", "2026-05-27"],
      ],
    },
  },
  "upload-note": {
    title: "Upload Lecture Note",
    subtitle: "Publish PDF, DOCX, and slides for enrolled students.",
    bullets: [
      "Accepted formats: PDF, DOCX, PPT.",
      "Maximum file size: 30MB.",
      "Attach to a course before publishing.",
    ],
  },
  quizzes: {
    title: "Quiz Management",
    subtitle: "Create quizzes, define timing, and review attempts.",
    table: {
      columns: ["Quiz", "Course", "Attempts", "Average Score"],
      rows: [
        ["Week 3 Quiz", "CSC101", "121", "78%"],
        ["SQL Basics", "CSC102", "90", "73%"],
      ],
    },
  },
  assignments: {
    title: "Assignment Grading",
    subtitle: "Review submissions and return feedback quickly.",
    table: {
      columns: ["Assignment", "Course", "Submissions", "Ungraded"],
      rows: [
        ["Variables and Loops", "CSC101", "124", "11"],
        ["SQL Joins", "CSC102", "88", "16"],
      ],
    },
  },
  profile: {
    title: "My Profile",
    subtitle: "Update your contact details and specialization.",
  },
};

const adminSections: Record<string, SectionContent> = {
  dashboard: {
    title: "Admin Dashboard",
    subtitle: "Platform-wide activity and approval controls.",
    stats: [
      { label: "Total Users", value: "2,148" },
      { label: "Active Lecturers", value: "63" },
      { label: "Open Approval Requests", value: "7" },
    ],
  },
  students: {
    title: "Students",
    subtitle: "Manage student profiles and enrollment records.",
    table: {
      columns: ["Name", "Email", "Role", "Status"],
      rows: [],
    },
  },
  lecturers: {
    title: "Lecturer Approvals",
    subtitle: "Review and approve pending lecturer applications.",
    table: {
      columns: ["Name", "Department", "Requested At", "Status"],
      rows: [["Dr. James M.", "Computing Sciences", "2026-05-28", "Pending"]],
    },
  },
  departments: {
    title: "Departments",
    subtitle: "Manage departments for programs and courses.",
    bullets: ["Create and update departments.", "Assign programs and courses to departments."],
  },
  programs: {
    title: "Programs",
    subtitle: "Manage academic programs and durations.",
    bullets: ["Create programs for departments.", "Assign levels and semesters where needed."],
  },
  courses: {
    title: "Courses",
    subtitle: "Manage course catalog, codes, and assignments.",
    bullets: ["Create courses and assign lecturers.", "Monitor student enrollments per course."],
  },
  "manage-content": {
    title: "Manage Content",
    subtitle: "Review lecture notes, videos, and uploads.",
    bullets: ["Approve or remove content.", "Track upload activity."],
  },
  assignments: {
    title: "Assignments",
    subtitle: "Monitor assignment creation and submissions.",
    bullets: ["Review course assignments.", "Track submission activity."],
  },
  quizzes: {
    title: "Quizzes",
    subtitle: "Monitor quiz creation and attempts.",
    bullets: ["Review quizzes per course.", "Track attempts and averages."],
  },
  "live-classes": {
    title: "Live Classes",
    subtitle: "Monitor and manage scheduled live sessions.",
    bullets: ["Review schedules.", "Manage meeting links and attendance."],
  },
  discussions: {
    title: "Discussions",
    subtitle: "Moderate course, program, and general discussions.",
    bullets: ["Review flagged threads.", "Moderate comments."],
  },
  announcements: {
    title: "Announcements",
    subtitle: "Post platform-wide announcements.",
    bullets: ["Create announcements.", "Schedule visibility windows."],
  },
  notifications: {
    title: "Notifications",
    subtitle: "Review system notifications delivered to users.",
    bullets: ["Audit notification templates.", "Monitor delivery volume."],
  },
  reports: {
    title: "Reports & Analytics",
    subtitle: "Track platform usage and performance.",
    bullets: ["User growth trends.", "Course and content engagement."],
  },
  settings: {
    title: "System Settings",
    subtitle: "Manage platform configuration.",
    bullets: ["Role permissions.", "Security and onboarding settings."],
  },
  "activity-logs": {
    title: "Activity Logs",
    subtitle: "Audit admin actions and important events.",
    bullets: ["Review admin activity.", "Export audit records."],
  },
};

export function getSectionContent(role: "student" | "lecturer" | "admin", section: string) {
  const collections: Record<"student" | "lecturer" | "admin", Record<string, SectionContent>> = {
    student: studentSections,
    lecturer: lecturerSections,
    admin: adminSections,
  };
  return collections[role][section];
}
