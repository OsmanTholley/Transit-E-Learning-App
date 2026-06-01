"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { useLecturers } from "@/hooks/use-lecturers";
import { requestApi } from "@/lib/fetch-api";
import type { ContentItem } from "@/types/academic";
import type { LecturerAdminDetail } from "@/types/lecturer-portal";
import { AllLecturersList } from "./all-lecturers-list";
import { AddLecturerForm } from "./add-lecturer-form";
import { AssignCoursesForm } from "./assign-courses-form";
import { LecturerMessagesPage } from "./lecturer-messages-page";
import { LecturersTable } from "./lecturers-table";
import {
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
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

export function UploadedMaterialsPage() {
  const { data, loading } = useApiLoad<AdminContentPayload>("/api/admin/content", {
    errorTitle: "Could not load materials",
  });

  const materials = [
    ...(data?.lectureNotes ?? []).map((m) => ({ ...m, kind: "Lecture note" as const })),
    ...(data?.videos ?? []).map((m) => ({ ...m, kind: "Video" as const })),
    ...(data?.assignments ?? []).map((m) => ({ ...m, kind: "Assignment" as const })),
    ...(data?.quizzes ?? []).map((m) => ({ ...m, kind: "Quiz" as const })),
  ].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <Panel title="Uploaded Materials Monitoring">
      <p className="mb-4 text-sm text-slate-600">
        Materials uploaded by lecturers across courses (from database).
      </p>
      {loading && !data ? (
        <p className="text-sm text-slate-500">Loading materials…</p>
      ) : materials.length === 0 ? (
        <p className="text-sm text-slate-500">No uploaded materials yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Lecturer", "Type", "Title", "Course", "Department", "Uploaded", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((m) => (
              <tr key={`${m.kind}-${m.id}`}>
                <td className="px-3 py-2 font-medium">{m.lecturer}</td>
                <td className="px-3 py-2">{m.kind}</td>
                <td className="px-3 py-2">{m.title}</td>
                <td className="px-3 py-2">{m.course}</td>
                <td className="px-3 py-2">{m.department}</td>
                <td className="px-3 py-2 text-slate-500">{m.uploadedAt}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={m.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

export function LecturerNotificationsPage() {
  return <LecturerMessagesPage />;
}

export function SuspendedLecturersPage() {
  const { lecturers, loading } = useLecturers();
  const suspended = lecturers.filter((l) => l.accountStatus === "Suspended");

  return (
    <Panel title="Discipline & Suspensions">
      <p className="mb-4 text-sm text-slate-600">
        Monitor inactive lecturers, misuse of platform, inappropriate content, and academic misconduct. Actions:
        Warning • Temporary suspension • Permanent suspension.
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Loading lecturers...</p>
      ) : (
        <LecturersTable lecturers={suspended} />
      )}
    </Panel>
  );
}

export function LecturerReportsPage() {
  const reports = [
    { name: "Lecturer List", formats: ["PDF", "Excel", "CSV"] },
    { name: "Course Assignment Report", formats: ["PDF", "Excel"] },
    { name: "Uploaded Materials Report", formats: ["PDF", "CSV"] },
    { name: "Quiz Activity Report", formats: ["PDF", "Excel"] },
    { name: "Assignment Grading Report", formats: ["PDF", "Excel", "CSV"] },
    { name: "Performance Analytics", formats: ["PDF", "Excel"] },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((r) => (
        <article key={r.name} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-semibold text-slate-900">{r.name}</h3>
          <p className="mt-1 text-xs text-slate-500">Export: {r.formats.join(", ")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {r.formats.map((f) => (
              <button
                key={f}
                type="button"
                className="rounded-lg bg-[#0B3D91] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a357f]"
              >
                {f}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
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
    return <p className="text-sm text-slate-500">Loading lecturer…</p>;
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
