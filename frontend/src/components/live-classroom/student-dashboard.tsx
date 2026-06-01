"use client";

import Link from "next/link";
import { useApiLoad } from "@/hooks/use-api-load";

type Session = {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  meetingPath: string;
};

type Payload = {
  sessions: Session[];
  recordings: {
    id: string;
    title: string;
    recordingUrl: string;
    courseCode: string;
    classTitle: string;
    createdAt: string;
  }[];
};

type AttendancePayload = {
  records: {
    id: string;
    course: string;
    joinTime: string;
    exitTime: string | null;
    durationLabel: string;
    attendancePercent: number;
    statusLabel: string;
  }[];
};

export function StudentLiveClassroomDashboard() {
  const { data, loading } = useApiLoad<Payload>("/api/student/live-classes", {
    errorTitle: "Could not load live classes",
  });
  const { data: attendance } = useApiLoad<AttendancePayload>(
    "/api/student/live-classes/attendance",
    { errorTitle: "Could not load attendance" }
  );

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#072d6b] p-6 text-white">
        <h2 className="text-2xl font-bold">Live Classroom</h2>
        <p className="mt-2 text-sm text-blue-100">
          Join scheduled classes, view screen sharing, chat, raise your hand, vote in polls, and
          review recordings. Attendance is tracked automatically.
        </p>
      </section>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Upcoming & live sessions</h3>
        </div>
        {loading && !data ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No live classes scheduled for your courses.</p>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {sessions.map((session) => {
              const canJoin =
                session.status === "LIVE" ||
                session.status === "SCHEDULED" ||
                session.status === "ENDED";
              return (
                <article
                  key={session.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-bold uppercase text-[#0B3D91]">{session.courseCode}</p>
                  <h4 className="mt-1 font-semibold text-slate-900">{session.title}</h4>
                  <p className="text-sm text-slate-500">Lecturer: {session.lecturerName}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {session.startTime
                      ? new Date(session.startTime).toLocaleString()
                      : "Time TBA"}{" "}
                    · {session.status}
                  </p>
                  <Link
                    href={`/student/live-classroom/${session.id}`}
                    className={[
                      "mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold",
                      canJoin
                        ? "bg-[#0B3D91] text-white hover:bg-[#0a357f]"
                        : "cursor-not-allowed bg-slate-100 text-slate-400",
                    ].join(" ")}
                  >
                    {session.status === "LIVE" ? "Join now" : "Enter classroom"}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {(data?.recordings.length ?? 0) > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="font-bold text-slate-900">Class recordings</h3>
          <ul className="mt-3 space-y-2">
            {data!.recordings.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>
                  {r.classTitle} ({r.courseCode})
                </span>
                <a
                  href={r.recordingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#0B3D91] hover:underline"
                >
                  Watch
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">My attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
              <tr>
                {["Course", "Join", "Exit", "Duration", "%", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(attendance?.records ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.course}</td>
                  <td className="px-4 py-3">{new Date(r.joinTime).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {r.exitTime ? new Date(r.exitTime).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">{r.durationLabel}</td>
                  <td className="px-4 py-3">{Math.round(r.attendancePercent)}%</td>
                  <td className="px-4 py-3 font-medium">{r.statusLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
