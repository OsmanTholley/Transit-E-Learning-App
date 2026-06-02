import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AppShell } from "@/components/app-shell";
import { SectionContentView } from "@/components/section-content";
import { LecturerAssignmentsPage } from "@/components/lecturer/lecturer-assignments-page";
import { LecturerCoursesPage } from "@/components/lecturer/lecturer-courses-page";
import { LecturerDashboard } from "@/components/lecturer/lecturer-dashboard";
import { LecturerMaterialsPage } from "@/components/lecturer/lecturer-materials-page";
import { LecturerProfilePage } from "@/components/lecturer/lecturer-profile-page";
import { LecturerQuizzesPage } from "@/components/lecturer/lecturer-quizzes-page";
import { LecturerStudentsPage } from "@/components/lecturer/lecturer-students-page";
import { LecturerVideosPage } from "@/components/lecturer/lecturer-videos-page";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { CoursesHub } from "@/components/student/courses/courses-hub";
import { AiTutorHub } from "@/components/student/ai-tutor/ai-tutor-hub";
import { NotesHub } from "@/components/student/lecture-notes/notes-hub";
import { QuizzesHub } from "@/components/student/quizzes/quizzes-hub";
import { DiscussionsHub } from "@/components/student/discussions/discussions-hub";
import { StudentNotificationsHub } from "@/components/student/notifications/student-notifications-hub";
import { AdminSectionView } from "@/components/admin/admin-section-view";
import { getSectionContent } from "@/services/mock-data";
import { AppRole } from "@/types/app";

const adminDbSections = new Set([
  "assignments",
  "quizzes",
  "discussions",
  "announcements",
  "notifications",
  "reports",
  "settings",
  "activity-logs",
]);

type Props = {
  role: AppRole;
  section: string;
};

export function PortalPage({ role, section }: Props) {
  const content = getSectionContent(role, section);

  if (!content) {
    notFound();
  }

  if (role === "student") {
    if (section === "dashboard") {
      return <StudentDashboard />;
    }
    if (section === "lecture-notes") {
      return <NotesHub />;
    }
    if (section === "quizzes") {
      return <QuizzesHub />;
    }
    if (section === "discussions") {
      return <DiscussionsHub />;
    }
    const coursesRedirects: Record<string, string> = {
      videos: "videos",
      assignments: "assignments",
    };
    if (coursesRedirects[section]) {
      return <CoursesHub segment={[coursesRedirects[section]]} />;
    }
    if (section === "ai-tutor") {
      return <AiTutorHub />;
    }
    if (section === "notifications") {
      return <StudentNotificationsHub />;
    }
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{content.title}</h1>
          <p className="text-sm text-slate-500">{content.subtitle}</p>
        </div>
        <SectionContentView content={content} />
      </div>
    );
  }

  if (role === "admin") {
    if (section === "dashboard") {
      return <AdminDashboard adminName="Administrator" />;
    }
    if (adminDbSections.has(section)) {
      return (
        <AdminSectionView
          section={section}
          fallbackTitle={content.title}
          fallbackSubtitle={content.subtitle}
        />
      );
    }
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{content.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{content.subtitle}</p>
        </div>
        <SectionContentView content={content} />
      </div>
    );
  }

  if (role === "lecturer") {
    if (section === "dashboard") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerDashboard />
        </AppShell>
      );
    }
    if (section === "courses") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerCoursesPage />
        </AppShell>
      );
    }
    if (section === "profile") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerProfilePage />
        </AppShell>
      );
    }
    if (section === "quizzes") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerQuizzesPage />
        </AppShell>
      );
    }
    if (section === "assignments") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerAssignmentsPage />
        </AppShell>
      );
    }
    if (section === "materials" || section === "upload-note") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerMaterialsPage />
        </AppShell>
      );
    }
    if (section === "videos") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerVideosPage />
        </AppShell>
      );
    }
    if (section === "students") {
      return (
        <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
          <LecturerStudentsPage />
        </AppShell>
      );
    }
  }

  return (
    <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
      <SectionContentView content={content} />
    </AppShell>
  );
}
