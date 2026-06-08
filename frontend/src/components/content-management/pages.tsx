"use client";

import { LoadingState } from "@/components/ui/loading-indicator";
import { useMemo, useState, type ReactNode } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import type { ContentItem } from "@/types/academic";
import { Panel, StatCard, StudentSection } from "@/components/student-management/ui";
import { AdminCrudSearch } from "@/components/admin/admin-entity-crud";
import { ContentTable } from "./content-table";
import { ContentCrudPageHero, type ContentCrudSection } from "./content-crud-hero";

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

function filterContentItems(items: ContentItem[], search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    [item.title, item.course, item.department, item.lecturer, item.type, item.status]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

function ContentLoading() {
  return <LoadingState message="Loading content from database…" panel minHeight={200} />;
}

type ContentListSectionProps = {
  section: ContentCrudSection;
  items: ContentItem[];
  tableTitle: string;
  searchPlaceholder: string;
  statsRow?: ReactNode;
  showApproval?: boolean;
  onReload: () => void;
  heroActions?: ReactNode;
};

function ContentListSection({
  section,
  items,
  tableTitle,
  searchPlaceholder,
  statsRow,
  showApproval,
  onReload,
  heroActions,
}: ContentListSectionProps) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => filterContentItems(items, search), [items, search]);
  const pending = items.filter((item) => item.status === "Pending").length;
  const approved = items.filter((item) => item.status === "Approved").length;

  return (
    <StudentSection>
      <ContentCrudPageHero section={section} actions={heroActions} />

      {statsRow ?? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total items" value={items.length} tone="blue" />
          <StatCard label="Approved" value={approved} tone="green" />
          <StatCard label="Pending" value={pending} tone="amber" />
          <StatCard label="Showing" value={filtered.length} tone="slate" />
        </div>
      )}

      <ContentTable
        title={tableTitle}
        items={filtered}
        showApproval={showApproval}
        onItemDeleted={onReload}
        onItemUpdated={onReload}
        toolbar={
          <AdminCrudSearch value={search} onChange={setSearch} placeholder={searchPlaceholder} />
        }
      />
    </StudentSection>
  );
}

export function LectureNotesPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const items = data?.lectureNotes ?? [];
  const stats = data?.stats;

  return (
    <ContentListSection
      section="lecture-notes"
      items={items}
      tableTitle="All lecture notes"
      searchPlaceholder="Search notes by title, course, or lecturer…"
      onReload={() => void reload()}
      statsRow={
        stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Lecture notes" value={stats.totalNotes} tone="blue" />
            <StatCard label="Pending approval" value={stats.pendingApproval} tone="amber" />
            <StatCard label="Videos" value={stats.totalVideos} tone="green" />
            <StatCard label="Assignments" value={stats.totalAssignments} tone="slate" />
          </div>
        ) : undefined
      }
    />
  );
}

export function VideosPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const items = data?.videos ?? [];
  const stats = data?.stats;

  return (
    <ContentListSection
      section="videos"
      items={items}
      tableTitle="All videos"
      searchPlaceholder="Search videos by title, course, or lecturer…"
      onReload={() => void reload()}
      statsRow={
        stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Videos" value={stats.totalVideos} tone="green" />
            <StatCard label="Lecture notes" value={stats.totalNotes} tone="blue" />
            <StatCard label="Quizzes" value={stats.totalQuizzes} tone="amber" />
            <StatCard label="Assignments" value={stats.totalAssignments} tone="slate" />
          </div>
        ) : undefined
      }
    />
  );
}

export function AssignmentsContentPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <ContentListSection
      section="assignments"
      items={data?.assignments ?? []}
      tableTitle="All assignments"
      searchPlaceholder="Search assignments by title, course, or lecturer…"
      onReload={() => void reload()}
    />
  );
}

export function QuizzesContentPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <ContentListSection
      section="quizzes"
      items={data?.quizzes ?? []}
      tableTitle="All quizzes"
      searchPlaceholder="Search quizzes by title, course, or lecturer…"
      onReload={() => void reload()}
    />
  );
}

export function DiscussionsContentPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  return (
    <ContentListSection
      section="discussions"
      items={data?.discussions ?? []}
      tableTitle="All discussions"
      searchPlaceholder="Search discussions by title, course, or lecturer…"
      onReload={() => void reload()}
    />
  );
}

export function AiTutorPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const stats = data?.stats;
  const allItems = [
    ...(data?.lectureNotes ?? []),
    ...(data?.videos ?? []),
    ...(data?.assignments ?? []),
    ...(data?.quizzes ?? []),
  ];

  return (
    <ContentListSection
      section="ai-tutor"
      items={allItems.slice(0, 30)}
      tableTitle="Recent academic content"
      searchPlaceholder="Search content linked to AI tutor resources…"
      onReload={() => void reload()}
      statsRow={
        stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="AI chat sessions" value={stats.aiChatSessions} tone="blue" />
            <StatCard label="Lecture notes" value={stats.totalNotes} tone="green" />
            <StatCard label="Videos" value={stats.totalVideos} tone="amber" />
            <StatCard label="Quizzes" value={stats.totalQuizzes} tone="slate" />
          </div>
        ) : undefined
      }
    />
  );
}

export function UploadedFilesPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const all = [
    ...(data?.lectureNotes ?? []),
    ...(data?.videos ?? []),
    ...(data?.assignments ?? []),
    ...(data?.quizzes ?? []),
  ];

  return (
    <ContentListSection
      section="files"
      items={all}
      tableTitle="All uploaded files"
      searchPlaceholder="Search files by title, type, course, or lecturer…"
      onReload={() => void reload()}
    />
  );
}

export function ContentApprovalPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const recent = [
    ...(data?.lectureNotes ?? []),
    ...(data?.videos ?? []),
    ...(data?.assignments ?? []),
    ...(data?.quizzes ?? []),
  ].slice(0, 40);

  const stats = data?.stats;

  return (
    <ContentListSection
      section="approval"
      items={recent}
      tableTitle="Recent uploads"
      searchPlaceholder="Search pending or recent uploads…"
      showApproval
      onReload={() => void reload()}
      statsRow={
        stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pending approval" value={stats.pendingApproval} tone="amber" />
            <StatCard label="Lecture notes" value={stats.totalNotes} tone="blue" />
            <StatCard label="Videos" value={stats.totalVideos} tone="green" />
            <StatCard label="Reported items" value={stats.reportedItems} tone="slate" />
          </div>
        ) : undefined
      }
    />
  );
}

export function ReportedContentPage() {
  const { data, loading, reload } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const stats = data?.stats;

  return (
    <StudentSection>
      <ContentCrudPageHero section="reported" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reported items" value={stats?.reportedItems ?? 0} tone="amber" />
        <StatCard label="Pending approval" value={stats?.pendingApproval ?? 0} tone="blue" />
        <StatCard label="Discussions" value={data?.discussions.length ?? 0} tone="green" />
        <StatCard label="Total content" value={(data?.lectureNotes.length ?? 0) + (data?.videos.length ?? 0)} tone="slate" />
      </div>

      <Panel title="Reported content queue">
        <p className="text-sm text-slate-600">
          {(stats?.reportedItems ?? 0) === 0
            ? "No reported content records in the database yet. When students flag material, items will appear here for review."
            : `${stats?.reportedItems} reported item(s) require moderator attention.`}
        </p>
      </Panel>

      <ContentTable
        title="Flagged discussions"
        items={data?.discussions.filter((d) => d.status === "Pending") ?? []}
        onItemDeleted={() => void reload()}
        onItemUpdated={() => void reload()}
      />
    </StudentSection>
  );
}

export function ContentAnalyticsPage() {
  const { data, loading } = useAdminContent();
  if (loading && !data) return <ContentLoading />;

  const stats = data?.stats;

  return (
    <StudentSection>
      <ContentCrudPageHero section="analytics" />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Lecture notes" value={stats.totalNotes.toLocaleString()} tone="blue" />
          <StatCard label="Videos" value={stats.totalVideos} tone="green" />
          <StatCard label="Quizzes" value={stats.totalQuizzes} tone="amber" />
          <StatCard label="Assignments" value={stats.totalAssignments} tone="blue" />
          <StatCard label="Pending approval" value={stats.pendingApproval} tone="amber" />
          <StatCard label="AI tutor sessions" value={stats.aiChatSessions} tone="slate" />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent content">
          <ul className="space-y-2 text-sm">
            {(data?.topContent ?? []).length === 0 ? (
              <li className="text-slate-500">No analytics data yet.</li>
            ) : (
              (data?.topContent ?? []).map((item) => (
                <li key={item.title} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>{item.title}</span>
                  {item.views ? <span className="text-xs text-slate-500">{item.views}</span> : null}
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel title="Most active lecturers">
          <ul className="space-y-2 text-sm">
            {(data?.topLecturers ?? []).length === 0 ? (
              <li className="text-slate-500">No upload activity recorded yet.</li>
            ) : (
              (data?.topLecturers ?? []).map((l) => (
                <li key={l.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>{l.name}</span>
                  <span className="font-semibold">{l.uploads} uploads</span>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </StudentSection>
  );
}
