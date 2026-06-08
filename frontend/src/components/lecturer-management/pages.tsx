"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { useLecturers } from "@/hooks/use-lecturers";
import { requestApi } from "@/lib/fetch-api";
import { showConfirm, showSuccess } from "@/lib/swal";
import type { ContentItem } from "@/types/academic";
import type { AdminContentTarget } from "@/types/admin-content";
import type { LecturerAdminDetail } from "@/types/lecturer-portal";
import { AdminRowActions, AdminCrudSearch, confirmAndDelete } from "@/components/admin/admin-entity-crud";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { AllLecturersList } from "./all-lecturers-list";
import { AddLecturerForm } from "./add-lecturer-form";
import { AssignCoursesForm } from "./assign-courses-form";
import { LecturerMessagesPage } from "./lecturer-messages-page";
import { LecturerCrudPageHero } from "./lecturer-crud-hero";
import { LecturersTable } from "./lecturers-table";
import {
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  StudentSection,
} from "@/components/student-management/ui";

export function AllLecturersPage() {
  return <AllLecturersList />;
}

export function AddLecturerPage() {
  return <AddLecturerForm />;
}

export function AssignCoursesPage() {
  return <AssignCoursesForm />;
}

type AdminContentPayload = {
  lectureNotes: ContentItem[];
  videos: ContentItem[];
  assignments: ContentItem[];
  quizzes: ContentItem[];
};

type MaterialRow = ContentItem & { kind: string; targetType: AdminContentTarget };

const targetToContentPath: Record<AdminContentTarget, string> = {
  "lecture-note": "/admin/content/lecture-notes",
  video: "/admin/content/videos",
  assignment: "/admin/content/assignments",
  quiz: "/admin/content/quizzes",
  discussion: "/admin/content/discussions",
};

export function UploadedMaterialsPage() {
  const router = useRouter();
  const { data, loading, reload } = useApiLoad<AdminContentPayload>("/api/admin/content", {
    errorTitle: "Could not load materials",
  });
  const [search, setSearch] = useState("");

  const materials: MaterialRow[] = [
    ...(data?.lectureNotes ?? []).map((m) => ({ ...m, kind: "Lecture note", targetType: "lecture-note" as const })),
    ...(data?.videos ?? []).map((m) => ({ ...m, kind: "Video", targetType: "video" as const })),
    ...(data?.assignments ?? []).map((m) => ({ ...m, kind: "Assignment", targetType: "assignment" as const })),
    ...(data?.quizzes ?? []).map((m) => ({ ...m, kind: "Quiz", targetType: "quiz" as const })),
  ].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const filtered = materials.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [m.title, m.lecturer, m.course, m.kind, m.department].join(" ").toLowerCase().includes(q);
  });

  if (loading && !data) {
    return <LoadingState message="Loading materials…" panel minHeight={200} />;
  }

  return (
    <StudentSection>
      <LecturerCrudPageHero section="materials" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total items" value={materials.length} tone="amber" />
        <StatCard label="Lecture notes" value={data?.lectureNotes.length ?? 0} tone="blue" />
        <StatCard label="Videos" value={data?.videos.length ?? 0} tone="slate" />
        <StatCard label="Quizzes & assignments" value={(data?.quizzes.length ?? 0) + (data?.assignments.length ?? 0)} tone="amber" />
      </div>

      <AdminTableShell
        title="Uploaded materials"
        count={filtered.length}
        countLabel="items"
        variant="detailed"
        toolbar={<AdminCrudSearch value={search} onChange={setSearch} placeholder="Search title, lecturer, course…" />}
      >
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {["Lecturer", "Type", "Title", "Course", "Uploaded", "Status", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2.5 sm:px-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  No uploaded materials yet.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={`${m.kind}-${m.id}`} className="admin-crud-table-row bg-white hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-medium sm:px-4">{m.lecturer}</td>
                  <td className="px-3 py-3 sm:px-4">{m.kind}</td>
                  <td className="px-3 py-3 sm:px-4">{m.title}</td>
                  <td className="px-3 py-3 text-slate-600 sm:px-4">{m.course}</td>
                  <td className="px-3 py-3 text-slate-500 sm:px-4">{m.uploadedAt}</td>
                  <td className="px-3 py-3 sm:px-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                    <AdminRowActions
                      viewHref={targetToContentPath[m.targetType]}
                      onEdit={() => router.push(targetToContentPath[m.targetType])}
                      onDelete={() =>
                        void confirmAndDelete(
                          `/api/admin/content/${m.targetType}/${m.id}`,
                          `Remove "${m.title}" from the platform?`,
                          () => void reload(),
                        )
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </StudentSection>
  );
}

export function LecturerNotificationsPage() {
  return <LecturerMessagesPage />;
}

export function SuspendedLecturersPage() {
  const { lecturers, loading, refetch } = useLecturers();
  const suspended = lecturers.filter((l) => l.accountStatus === "Suspended");
  const pending = lecturers.filter((l) => l.verificationStatus === "Pending").length;

  if (loading) {
    return <LoadingState message="Loading lecturers…" panel minHeight={200} />;
  }

  return (
    <StudentSection>
      <LecturerCrudPageHero section="suspended" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Suspended" value={suspended.length} tone="rose" />
        <StatCard label="Pending verification" value={pending} tone="amber" />
        <StatCard label="Total lecturers" value={lecturers.length} tone="blue" />
      </div>

      <Panel title="Discipline policy">
        <p className="text-sm text-slate-600">
          Monitor inactive lecturers, misuse of platform, inappropriate content, and academic misconduct. Actions:
          Warning • Temporary suspension • Permanent suspension.
        </p>
      </Panel>

      <LecturersTable
        lecturers={suspended}
        title="Suspended lecturers"
        onRefresh={() => void refetch()}
      />
    </StudentSection>
  );
}

type ReportRow = { id: string; name: string; formats: string[] };

const defaultReports: ReportRow[] = [
  { id: "lecturer-list", name: "Lecturer List", formats: ["PDF", "Excel", "CSV"] },
  { id: "course-assignment", name: "Course Assignment Report", formats: ["PDF", "Excel"] },
  { id: "materials", name: "Uploaded Materials Report", formats: ["PDF", "CSV"] },
  { id: "quiz-activity", name: "Quiz Activity Report", formats: ["PDF", "Excel"] },
  { id: "grading", name: "Assignment Grading Report", formats: ["PDF", "Excel", "CSV"] },
  { id: "performance", name: "Performance Analytics", formats: ["PDF", "Excel"] },
];

export function LecturerReportsPage() {
  const { lecturers, loading, refetch } = useLecturers();
  const [reports, setReports] = useState<ReportRow[]>(defaultReports);
  const active = lecturers.filter((l) => l.accountStatus === "Active").length;
  const withCourses = lecturers.filter((l) => l.assignedCourses > 0).length;

  if (loading) {
    return <LoadingState message="Loading lecturer reports…" panel minHeight={200} />;
  }

  return (
    <StudentSection>
      <LecturerCrudPageHero section="reports" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total lecturers" value={lecturers.length} tone="amber" />
        <StatCard label="Active" value={active} tone="blue" />
        <StatCard label="With courses" value={withCourses} tone="slate" />
        <StatCard label="Report types" value={reports.length} tone="amber" />
      </div>

      <AdminTableShell title="Export reports" count={reports.length} countLabel="reports" variant="detailed">
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {["Report", "Formats", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2.5 sm:px-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((r) => (
              <tr key={r.id} className="admin-crud-table-row bg-white hover:bg-slate-50/80">
                <td className="px-3 py-3 font-medium sm:px-4">{r.name}</td>
                <td className="px-3 py-3 text-slate-600 sm:px-4">{r.formats.join(", ")}</td>
                <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                  <AdminRowActions
                    viewHref="/admin/lecturers/all"
                    onEdit={() =>
                      void showSuccess("Export formats", `${r.name} can be exported as: ${r.formats.join(", ")}.`)
                    }
                    onDelete={() =>
                      void (async () => {
                        const ok = await showConfirm(
                          "Remove report?",
                          `Remove "${r.name}" from the report catalog?`,
                        );
                        if (ok) setReports((prev) => prev.filter((row) => row.id !== r.id));
                      })()
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <LecturersTable
        lecturers={lecturers.slice(0, 10)}
        title="Lecturer directory (for reports)"
        onRefresh={() => void refetch()}
      />
    </StudentSection>
  );
}

export function LecturerProfilePage({ id }: { id: string }) {
  const [detail, setDetail] = useState<LecturerAdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await requestApi<LecturerAdminDetail>(`/api/lecturers/${id}`, {
        errorTitle: "Could not load lecturer",
        onRecovered: () => {
          if (!cancelled && mountedRef.current) {
            void load();
          }
        },
      });

      if (cancelled || !mountedRef.current) return;

      if (result.ok) {
        setDetail(result.data);
      } else if (!result.offline) {
        setDetail(null);
      }

      if (!result.offline) {
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading lecturer…" layout="inline" />;
  }

  if (!detail) {
    return (
      <Panel title="Lecturer Not Found">
        <Link href="/admin/lecturers/all" className="text-sm font-semibold text-[#0B3D91]">
          ← Back to all lecturers
        </Link>
      </Panel>
    );
  }

  const { lecturer, courseList, materials, stats } = detail;
  const gradingPct = stats.gradedPct;

  return (
    <div className="space-y-6">
      <Link href="/admin/lecturers/all" className="text-sm font-semibold text-[#0B3D91]">
        ← Back to All Lecturers
      </Link>
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B3D91] text-xl font-bold text-white">
          {lecturer.avatarInitials}
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{lecturer.fullName}</h2>
          <p className="text-sm text-slate-500">
            {lecturer.email} • {lecturer.specialization}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={lecturer.verificationStatus} />
            <StatusBadge status={lecturer.accountStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton>Edit</SecondaryButton>
          <SecondaryButton>Reset Password</SecondaryButton>
          {lecturer.verificationStatus !== "Verified" ? <PrimaryButton>Approve</PrimaryButton> : null}
          <button type="button" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
            Suspend
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Personal Information">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["Email", lecturer.email],
              ["Phone", lecturer.phone],
              ["Registered", lecturer.registeredAt],
              ["Specialization", lecturer.specialization],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Department Information">
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Department</dt>
              <dd className="font-medium">{lecturer.department}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Assigned Courses</dt>
              <dd className="font-medium">{lecturer.assignedCourses}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      {courseList.length > 0 ? (
        <Panel title="Assigned courses">
          <ul className="space-y-2 text-sm">
            {courseList.map((c) => (
              <li key={c.code} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-mono text-xs text-slate-500">{c.code}</span> — {c.title} (
                {c.students} students)
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Uploaded Materials">
          {materials.length === 0 ? (
            <p className="text-sm text-slate-500">No materials uploaded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {materials.map((m, i) => (
                <li key={`${m.title}-${i}`} className="rounded-lg bg-slate-50 px-3 py-2">
                  {m.title} ({m.type}) — {m.course}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Quiz Activities">
          <p className="text-sm">
            {stats.quizzesCreated} quiz{stats.quizzesCreated === 1 ? "" : "zes"} created •{" "}
            {stats.quizAttempts.toLocaleString()} total attempts
          </p>
        </Panel>
        <Panel title="Assignment Activities">
          <p className="text-sm">
            {stats.assignmentsCount} assignment{stats.assignmentsCount === 1 ? "" : "s"} • {gradingPct}%
            graded ({stats.gradedSubmissions}/{stats.totalSubmissions})
          </p>
        </Panel>
        <Panel title="Content summary">
          <p className="text-sm">
            {stats.lectureNotes} lecture notes • {stats.videos} videos
          </p>
        </Panel>
        <Panel title="Performance Analytics">
          <p className="text-2xl font-bold text-[#0B3D91]">{gradingPct}%</p>
          <p className="text-xs text-slate-500">Assignment grading completion</p>
        </Panel>
      </div>
    </div>
  );
}
