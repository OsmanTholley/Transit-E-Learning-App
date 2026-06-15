"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { TransitLogo } from "@/components/brand/transit-logo";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { showError, showSuccess } from "@/lib/swal";

type LiveClassItem = {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  roomName: string | null;
  courseId?: string | null;
  startTime: string | null;
  endTime: string | null;
  course: { courseCode: string; courseTitle: string } | null;
  lecturerName?: string | null;
};

type LecturerCourse = { id: string; courseCode: string; courseTitle: string };

type LiveClassesHubProps = {
  role: "student" | "lecturer";
};

const LIST_REFRESH_MS = 15_000;

function statusPill(status: string) {
  const styles: Record<string, string> = {
    LIVE: "bg-red-100 text-red-800 ring-1 ring-red-200",
    SCHEDULED: "bg-blue-100 text-blue-800",
    ENDED: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status === "LIVE" ? "● Live now" : status}
    </span>
  );
}

function formatScheduleRange(startTime: string | null, endTime: string | null) {
  if (!startTime) return "No start time scheduled";
  const start = new Date(startTime).toLocaleString();
  if (!endTime) return `Starts ${start}`;
  const end = new Date(endTime).toLocaleString();
  return `${start} — ${new Date(endTime).toLocaleString()}`;
}

export function LiveClassesHub({ role }: LiveClassesHubProps) {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [courses, setCourses] = useState<LecturerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCourseId, setEditCourseId] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const endpoint = role === "lecturer" ? "/api/lecturer/live-classes" : "/api/student/live-classes";

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const result = await requestApi<{ classes: LiveClassItem[] }>(endpoint, { silent: true });
    if (!silent) setLoading(false);
    if (result.ok) setClasses(result.data.classes);
  };

  useEffect(() => {
    scheduleEffectWork(() => load());
    if (role === "lecturer") {
      void requestApi<{ courses: LecturerCourse[] }>("/api/lecturer/courses/options", { silent: true }).then((result) => {
        if (result.ok) {
          setCourses(result.data.courses ?? []);
          if (result.data.courses?.[0]) setCourseId(result.data.courses[0].id);
        }
      });
    }

    const timer = window.setInterval(() => void load(true), LIST_REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [role]);

  const scheduleClass = async (event: FormEvent) => {
    event.preventDefault();
    const result = await requestApi(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, title, startTime, endTime: endTime || undefined }),
      silent: true,
    });

    if (!result.ok) {
      await showError("Could not schedule class", result.offline ? "You are offline." : result.message);
      return;
    }

    await showSuccess("Virtual Room scheduled", "Start the session when you are ready — up to 100 participants.");
    setTitle("");
    setEndTime("");
    void load();
  };

  const openEdit = (item: LiveClassItem) => {
    setEditingId(item.id);
    setEditTitle(item.title ?? "");
    setEditCourseId(item.courseId ?? courseId);
    setEditStartTime(item.startTime ? item.startTime.slice(0, 16) : "");
    setEditEndTime(item.endTime ? item.endTime.slice(0, 16) : "");
  };

  const saveEdit = async (classId: string) => {
    const result = await requestApi(`/api/lecturer/live-classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        title: editTitle,
        courseId: editCourseId,
        startTime: editStartTime,
        endTime: editEndTime || null,
      }),
      silent: true,
    });
    if (!result.ok) {
      await showError("Could not update class", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Class updated", "Your scheduled session has been saved.");
    setEditingId(null);
    void load();
  };

  const cancelClass = async (classId: string) => {
    const result = await requestApi(`/api/lecturer/live-classes/${classId}`, {
      method: "DELETE",
      silent: true,
    });
    if (!result.ok) {
      await showError("Could not cancel class", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Class cancelled", "Students will no longer see this session.");
    void load();
  };

  const liveNow = classes.filter((item) => item.status === "LIVE");
  const upcoming = classes.filter((item) => item.status !== "LIVE");

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[#0B3D91]/15 bg-gradient-to-br from-[#0B3D91] to-[#072a66] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <TransitLogo size="md" variant="light" showText={false} />
            <div>
              <h1 className="text-2xl font-semibold">Transit Virtual Room</h1>
              <p className="mt-1 max-w-xl text-sm text-white/80">
                Teams-style live video, chat, and screen sharing — built into your portal. No external apps, no
                teams.live.com links, no leaving the site.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
            <p className="font-medium text-[#FFC107]">Lightweight · Portal-only</p>
            <p className="mt-1 text-white/70">
              Voice · Video · Screen share (lecturer) · Chat · Raise hand
            </p>
          </div>
        </div>
      </div>

      {role === "lecturer" ? (
        <form onSubmit={scheduleClass} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Schedule a Virtual Room</h2>
          <p className="mt-1 text-sm text-slate-500">Students join from their Virtual Room page inside the portal.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Class title"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.courseCode} — {course.courseTitle}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              aria-label="Start time"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              min={startTime || undefined}
              aria-label="End time"
              placeholder="End time"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-[#0B3D91] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3580]"
            >
              Schedule
            </button>
          </div>
        </form>
      ) : null}

      {liveNow.length > 0 ? (
        <section className="overflow-hidden rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-white shadow-sm">
          <div className="border-b border-red-100 bg-red-600 px-5 py-3">
            <h2 className="text-lg font-semibold text-white">
              {role === "student" ? "Join Virtual Room now" : "Virtual Rooms in progress"}
            </h2>
            <p className="text-sm text-red-100">
              {role === "student"
                ? "Your lecturer has started these classes — tap Join to enter the classroom."
                : "Students can see and join these classes. You can leave and rejoin anytime until you end the class."}
            </p>
          </div>
          <div className="divide-y divide-red-100">
            {liveNow.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{item.title ?? "Live session"}</p>
                    {statusPill(item.status)}
                  </div>
                  <p className="text-sm text-slate-600">
                    {item.course?.courseCode} · {item.course?.courseTitle}
                    {item.lecturerName ? ` · ${item.lecturerName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatScheduleRange(item.startTime, item.endTime)}</p>
                </div>
                <Link
                  href={`/${role}/live-classes/${item.id}`}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  {role === "student" ? "Join class" : "Rejoin class"}
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-medium text-slate-900">
            {role === "lecturer" ? "Scheduled classes" : "Upcoming classes"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {role === "student"
              ? "These sessions have not started yet. A Join button will appear here when the lecturer goes live."
              : "Edit or cancel before you start. After ending a class it is removed from this list."}
          </p>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-500">Loading classes…</p>
        ) : upcoming.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">
            {role === "lecturer"
              ? liveNow.length > 0
                ? "No other scheduled classes."
                : "Schedule your first class above."
              : liveNow.length > 0
                ? "No upcoming classes — check the live section above."
                : "No Virtual Rooms scheduled for your courses yet."}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map((item) => (
              <div key={item.id} className="px-5 py-4">
                {editingId === item.id ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Class title"
                    />
                    <select
                      value={editCourseId}
                      onChange={(event) => setEditCourseId(event.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.courseCode} — {course.courseTitle}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(event) => setEditStartTime(event.target.value)}
                      aria-label="Start time"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="datetime-local"
                      value={editEndTime}
                      onChange={(event) => setEditEndTime(event.target.value)}
                      min={editStartTime || undefined}
                      aria-label="End time"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(item.id)}
                        className="rounded-md bg-[#0B3D91] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a3580]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{item.title ?? "Live session"}</p>
                        {statusPill(item.status)}
                      </div>
                      <p className="text-sm text-slate-500">
                        {item.course?.courseCode} · {item.course?.courseTitle}
                        {item.lecturerName ? ` · ${item.lecturerName}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">{formatScheduleRange(item.startTime, item.endTime)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role === "lecturer" && item.status === "SCHEDULED" ? (
                        <>
                          <Link
                            href={`/lecturer/live-classes/${item.id}`}
                            className="rounded-md bg-[#0B3D91] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a3580]"
                          >
                            Enter classroom
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void cancelClass(item.id)}
                            className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Cancel class
                          </button>
                        </>
                      ) : null}
                      {role === "student" && item.status === "SCHEDULED" ? (
                        <span className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
                          Waiting for lecturer to start
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
