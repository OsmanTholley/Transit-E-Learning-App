"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import type { LiveClassAnalytics } from "@/types/live-classroom";

type Payload = {
  sessions: {
    id: string;
    title: string;
    courseCode: string;
    lecturerName: string;
    status: string;
    startTime: string | null;
  }[];
  analytics: LiveClassAnalytics;
  attendance: {
    studentIdCode: string;
    studentName: string;
    course: string;
    joinTime: string;
    exitTime: string | null;
    durationSeconds: number;
    attendancePercent: number;
    statusLabel: string;
  }[];
};

export function AdminLiveClassroomDashboard() {
  const { data, loading } = useApiLoad<Payload>("/api/admin/live-classroom", {
    errorTitle: "Could not load live classroom analytics",
  });

  function exportReport(format: "csv" | "pdf") {
    window.open(`/api/admin/live-classroom/export?format=${format}`, "_blank");
  }

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading live classroom analytics…</p>;
  }

  const analytics = data?.analytics;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-800 to-[#0B3D91] p-6 text-white">
        <h2 className="text-2xl font-bold">Live Classroom Administration</h2>
        <p className="mt-2 text-sm text-emerald-100">
          Platform-wide attendance analytics, session monitoring, and exportable reports (CSV /
          Excel-compatible).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportReport("csv")}
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0B3D91] hover:bg-slate-100"
          >
            Export Excel (CSV)
          </button>
          <button
            type="button"
            onClick={() => exportReport("pdf")}
            className="rounded-xl border border-white/40 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
          >
            Export PDF report
          </button>
        </div>
      </section>

      {analytics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total sessions", value: analytics.totalSessions },
            { label: "Live now", value: analytics.liveNow },
            { label: "Upcoming", value: analytics.upcoming },
            { label: "Avg attendance %", value: `${analytics.averageAttendance}%` },
            { label: "Present", value: analytics.presentCount },
            { label: "Partial", value: analytics.partialCount },
            { label: "Absent", value: analytics.absentCount },
          ].map((s) => (
            <article key={s.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-500">{s.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
            </article>
          ))}
        </div>
      ) : null}

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Recent sessions</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
            <tr>
              {["Title", "Course", "Lecturer", "Status", "Start"].map((h) => (
                <th key={h} className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.sessions ?? []).map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.title}</td>
                <td className="px-4 py-3">{s.courseCode}</td>
                <td className="px-4 py-3">{s.lecturerName}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">
                  {s.startTime ? new Date(s.startTime).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Attendance report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
              <tr>
                {[
                  "Student ID",
                  "Name",
                  "Course",
                  "Join",
                  "Exit",
                  "Duration (s)",
                  "%",
                  "Status",
                ].map((h) => (
                  <th key={h} className="px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.attendance ?? []).map((r, i) => (
                <tr key={`${r.studentIdCode}-${i}`}>
                  <td className="px-3 py-2 font-mono text-xs">{r.studentIdCode}</td>
                  <td className="px-3 py-2">{r.studentName}</td>
                  <td className="px-3 py-2">{r.course}</td>
                  <td className="px-3 py-2">{new Date(r.joinTime).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {r.exitTime ? new Date(r.exitTime).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">{r.durationSeconds}</td>
                  <td className="px-3 py-2">{Math.round(r.attendancePercent)}</td>
                  <td className="px-3 py-2 font-medium">{r.statusLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
