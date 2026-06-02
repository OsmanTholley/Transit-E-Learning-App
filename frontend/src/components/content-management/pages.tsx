"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import type { ContentItem } from "@/types/academic";
import {
  Panel,
  StatCard,
  StatusBadge,
  StudentSection,
} from "@/components/student-management/ui";
import { ContentTable } from "./content-table";

type AdminContentData = {
  stats: {
    totalNotes: number;
    totalVideos: number;
    totalQuizzes: number;
    totalAssignments: number;
    pendingApproval: number;
    reportedItems: number;
    aiChatSessions: number;
  };
  lectureNotes: ContentItem[];
  videos: ContentItem[];
  assignments: ContentItem[];
  quizzes: ContentItem[];
  discussions: ContentItem[];
  topLecturers: { name: string; uploads: number }[];
  topContent: { title: string; views: string }[];
};

function useAdminContent() {
  return useApiLoad<AdminContentData>("/api/admin/content", {
    errorTitle: "Could not load content",
  });
}

function ContentOverviewCards({ stats }: { stats: AdminContentData["stats"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Lecture Notes" value={stats.totalNotes.toLocaleString()} tone="blue" />
      <StatCard label="Videos" value={stats.totalVideos} tone="green" />
      <StatCard label="Quizzes" value={stats.totalQuizzes} tone="amber" />
      <StatCard label="Assignments" value={stats.totalAssignments} tone="blue" />
      <StatCard label="Pending Approval" value={stats.pendingApproval} tone="amber" />
      <StatCard label="AI Tutor sessions" value={stats.aiChatSessions} tone="slate" />
    </div>
  );
}

function ContentLoading() {
  return <p className="text-sm text-slate-500">Loading content from database…</p>;
}

export function LectureNotesPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <StudentSection>
      {data ? <ContentOverviewCards stats={data.stats} /> : null}
      <ContentTable
        title="Lecture notes"
        items={data?.lectureNotes ?? []}
        onItemDeleted={() => void reload()}
      />
    </StudentSection>
  );
}

export function VideosPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <StudentSection>
      <ContentTable
        title="Videos"
        items={data?.videos ?? []}
        onItemDeleted={() => void reload()}
      />
    </StudentSection>
  );
}

export function AssignmentsContentPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <StudentSection>
      <ContentTable title="Assignments" items={data?.assignments ?? []} />
    </StudentSection>
  );
}

export function QuizzesContentPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <StudentSection>
      <ContentTable title="Quizzes" items={data?.quizzes ?? []} />
    </StudentSection>
  );
}

export function DiscussionsContentPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <StudentSection>
      <Panel title="Discussion moderation">
        <p className="mb-4 text-sm text-slate-600">Monitor course discussions from the database.</p>
      </Panel>
      <ContentTable title="Discussions" items={data?.discussions ?? []} />
    </StudentSection>
  );
}

export function AiTutorPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <Panel title="AI Tutor Resources">
      <p className="text-sm text-slate-600">
        Total student AI tutor chat sessions recorded:{" "}
        <strong>{data?.stats.aiChatSessions ?? 0}</strong>
      </p>
    </Panel>
  );
}

export function UploadedFilesPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const all = [
    ...(data?.lectureNotes ?? []),
    ...(data?.videos ?? []),
    ...(data?.assignments ?? []),
    ...(data?.quizzes ?? []),
  ];

  return (
    <StudentSection>
      <ContentTable title="Uploaded files" items={all} />
    </StudentSection>
  );
}

export function ContentApprovalPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <StudentSection>
      <Panel title="Content approval">
        <p className="text-sm text-slate-600">
          All uploaded content in the database is available to students. Pending approval count:{" "}
          {data?.stats.pendingApproval ?? 0}.
        </p>
      </Panel>
      <ContentTable title="Recent uploads" items={data?.lectureNotes.slice(0, 20) ?? []} />
    </StudentSection>
  );
}

export function ReportedContentPage() {
  return (
    <Panel title="Reported Content">
      <p className="text-sm text-slate-500">No reported content records in the database yet.</p>
    </Panel>
  );
}

export function ContentAnalyticsPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <div className="space-y-6">
      {data ? <ContentOverviewCards stats={data.stats} /> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent content">
          <ul className="space-y-2 text-sm">
            {(data?.topContent ?? []).map((item) => (
              <li key={item.title} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Most active lecturers">
          <ul className="space-y-2 text-sm">
            {(data?.topLecturers ?? []).map((l) => (
              <li key={l.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{l.name}</span>
                <span className="font-semibold">{l.uploads} uploads</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
