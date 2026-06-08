import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AppShell } from "@/components/app-shell";
import { SectionContentView } from "@/components/section-content";
import { LecturerAiPage } from "@/components/lecturer/lecturer-ai-page";
import { LecturerAssignmentsPage } from "@/components/lecturer/lecturer-assignments-page";
import { LecturerCoursesPage } from "@/components/lecturer/lecturer-courses-page";
import { LecturerDashboard } from "@/components/lecturer/lecturer-dashboard";
import { LecturerMaterialsPage } from "@/components/lecturer/lecturer-materials-page";
import { AdminProfilePage } from "@/components/admin/admin-profile-page";
import { LecturerProfilePage } from "@/components/lecturer/lecturer-profile-page";
import { StudentProfilePage } from "@/components/student/student-profile-page";
import { LecturerQuizzesPage } from "@/components/lecturer/lecturer-quizzes-page";
import { LecturerStudentsPage } from "@/components/lecturer/lecturer-students-page";
import { LecturerVideosPage } from "@/components/lecturer/lecturer-videos-page";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { CoursesHub } from "@/components/student/courses/courses-hub";
import { AiTutorHub } from "@/components/student/ai-tutor/ai-tutor-hub";
import { NotesHub } from "@/components/student/lecture-notes/notes-hub";
import { QuizzesHub } from "@/components/student/quizzes/quizzes-hub";
import { DiscussionsHub } from "@/components/student/discussions/discussions-hub";
import { UserNotificationsHub } from "@/components/notifications/user-notifications-hub";
import { StudentNotificationsHub } from "@/components/student/notifications/student-notifications-hub";
import { AdminSectionView } from "@/components/admin/admin-section-view";
import { AdminAnnouncementsPage } from "@/components/admin/system/admin-announcements-page";
import { AdminNotificationsPage } from "@/components/admin/system/admin-notifications-page";
import { AdminSettingsPage } from "@/components/admin/system/admin-settings-page";
import { AdminActivityLogsPage } from "@/components/admin/system/admin-activity-logs-page";
import { AdminYouTubeViewsPage } from "@/components/admin/system/admin-youtube-views-page";
import { getSectionContent } from "@/services/mock-data";
import { AppRole } from "@/types/app";

const adminDbSections = new Set(["assignments", "quizzes", "discussions"]);

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
    if (section === "profile") {
      return <StudentProfilePage />;
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
    if (section === "profile") {
      return <AdminProfilePage />;
    }
    if (section === "announcements") {
      return <AdminAnnouncementsPage />;
    }
    if (section === "notifications") {
      return <AdminNotificationsPage />;
    }
    if (section === "settings") {
      return <AdminSettingsPage />;
    }
    if (section === "activity-logs") {
      return <AdminActivityLogsPage />;
    }
    if (section === "youtube-views") {
      return <AdminYouTubeViewsPage />;
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
      return <LecturerDashboard />;
    }
    if (section === "courses") {
      return <LecturerCoursesPage />;
    }
    if (section === "profile") {
      return <LecturerProfilePage />;
    }
    if (section === "quizzes") {
      return <LecturerQuizzesPage />;
    }
    if (section === "assignments") {
      return <LecturerAssignmentsPage />;
    }
    if (section === "materials" || section === "upload-note") {
      return <LecturerMaterialsPage />;
    }
    if (section === "videos") {
      return <LecturerVideosPage />;
    }
    if (section === "students") {
      return <LecturerStudentsPage />;
    }
    if (section === "ai") {
      return <LecturerAiPage />;
    }
    if (section === "notifications") {
      return <UserNotificationsHub title={content.title} subtitle={content.subtitle} />;
    }
  }

  return (
    <AppShell role={role} pageTitle={content.title} subtitle={content.subtitle}>
      <SectionContentView content={content} />
    </AppShell>
  );
}
