"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { requestApi } from "@/lib/fetch-api";
import type { LiveClassListItem } from "@/types/live-classroom";

type CoursesPayload = { courses: { id: string; courseCode: string; courseTitle: string }[] };
type SessionsPayload = { sessions: LiveClassListItem[] };
type AttendancePayload = {
  records: {
    id: string;
    liveClassTitle: string;
    studentIdCode: string;
    studentName: string;
    course: string;
    joinTime: string;
    exitTime: string | null;
    durationLabel: string;
    attendancePercent: number;
    statusLabel: string;
  }[];
};

export function LecturerLiveClassroomDashboard() {
  const { data, loading, setData } = useApiLoad<SessionsPayload>("/api/lecturer/live-classes", {
    errorTitle: "Could not load live classes",
  });
  const { data: coursesData } = useApiLoad<CoursesPayload>("/api/lecturer/live-classes/courses", {
    errorTitle: "Could not load courses",
  });
  const { data: attendanceData } = useApiLoad<AttendancePayload>(
    "/api/lecturer/live-classes/attendance",
    { errorTitle: "Could not load attendance" }
  );

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [scheduling, setScheduling] = useState(false);

  async function scheduleClass(e: FormEvent) {
    e.preventDefault();
    setScheduling(true);
    const result = await requestApi<SessionsPayload>("/api/lecturer/live-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, title, description, startTime, endTime }),
      errorTitle: "Could not schedule class",
    });
    if (result.ok) {
      setData(result.data);
      setTitle("");
      setDescription("");
    }
    setScheduling(false);
  }

  const sessions = data?.sessions ?? [];
  const liveCount = sessions.filter((s) => s.status === "LIVE").length;
  const upcoming = sessions.filter((s) => s.status === "SCHEDULED").length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Live Classroom</p>
        <h2 className="mt-2 text-2xl font-bold">Microsoft Teams–style teaching hub</h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-100">
          Schedule sessions, start video classes with screen sharing, use the interactive whiteboard,
          run polls, manage participants, record classes, and track attendance automatically.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Live now", value: liveCount },
          { label: "Upcoming", value: upcoming },
          { label: "Total sessions", value: sessions.length },
        ].map((stat) => (
          <article key={stat.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={scheduleClass}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="font-bold text-slate-900">Schedule live class</h3>
          <div className="mt-4 space-y-3">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select course</option>
              {(coursesData?.courses ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} – {c.courseTitle}
                </option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Class title"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={scheduling}
              className="w-full rounded-xl bg-[#0B3D91] py-2.5 text-sm font-bold text-white hover:bg-[#0a357f] disabled:opacity-60"
            >
              {scheduling ? "Scheduling…" : "Schedule class"}
            </button>
          </div>
        </form>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-bold text-slate-900">Attendance rules</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="rounded-lg bg-emerald-50 px-3 py-2">≥80% of class duration → Present</li>
            <li className="rounded-lg bg-amber-50 px-3 py-2">50–79% → Partial Attendance</li>
            <li className="rounded-lg bg-rose-50 px-3 py-2">&lt;50% → Absent</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Join time, exit time, duration, and status are recorded automatically per student.
          </p>
        </section>
      </div>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Your sessions</h3>
        </div>
        {loading && !data ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No live classes scheduled yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{session.title}</p>
                  <p className="text-sm text-slate-500">
                    {session.courseCode} · {session.status} ·{" "}
                    {session.startTime
                      ? new Date(session.startTime).toLocaleString()
                      : "Unscheduled"}
                  </p>
                </div>
                <Link
                  href={`/lecturer/live-classroom/${session.id}`}
                  className="rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-bold text-white hover:bg-[#0a357f]"
                >
                  {session.status === "LIVE" ? "Enter class" : "Start / enter"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Attendance analytics</h3>
          <p className="mt-1 text-xs text-slate-500">
            Student ID, name, course, join/exit times, duration, percentage, and status are recorded
            automatically.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
              <tr>
                {[
                  "Class",
                  "Student ID",
                  "Name",
                  "Course",
                  "Join",
                  "Exit",
                  "Duration",
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
              {(attendanceData?.records ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    No attendance records yet. Run a live class to start tracking.
                  </td>
                </tr>
              ) : (
                attendanceData!.records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{r.liveClassTitle}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.studentIdCode}</td>
                    <td className="px-3 py-2">{r.studentName}</td>
                    <td className="px-3 py-2">{r.course}</td>
                    <td className="px-3 py-2">{new Date(r.joinTime).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      {r.exitTime ? new Date(r.exitTime).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2">{r.durationLabel}</td>
                    <td className="px-3 py-2">{Math.round(r.attendancePercent)}</td>
                    <td className="px-3 py-2 font-medium">{r.statusLabel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
