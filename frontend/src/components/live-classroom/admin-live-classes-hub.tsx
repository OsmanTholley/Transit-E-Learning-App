"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { TransitLogo } from "@/components/brand/transit-logo";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";

type LiveClassItem = {
  id: string;
  title: string | null;
  status: string;
  courseId?: string | null;
  lecturerId?: string | null;
  startTime: string | null;
  endTime: string | null;
  course: { courseCode: string; courseTitle: string } | null;
  lecturerName?: string | null;
};

type CourseOption = {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string | null;
  lecturerName: string | null;
  studentCount: number;
};

type LecturerOption = { id: string; name: string };
type StudentOption = { id: string; studentId: string; fullName: string };

const LIST_REFRESH_MS = 15_000;

function statusPill(status: string) {
  const styles: Record<string, string> = {
    LIVE: "bg-red-100 text-red-800 ring-1 ring-red-200",
    SCHEDULED: "bg-blue-100 text-blue-800",
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
  return `${start} — ${new Date(endTime).toLocaleString()}`;
}

export function AdminLiveClassesHub() {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lecturerId, setLecturerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const result = await requestApi<{ classes: LiveClassItem[] }>("/api/admin/live-classes", { silent: true });
    if (!silent) setLoading(false);
    if (result.ok) setClasses(result.data.classes);
  };

  const loadOptions = async (selectedCourseId?: string) => {
    const url = selectedCourseId
      ? `/api/admin/live-classes/options?courseId=${encodeURIComponent(selectedCourseId)}`
      : "/api/admin/live-classes/options";
    const result = await requestApi<{
      courses: CourseOption[];
      lecturers: LecturerOption[];
      students: StudentOption[];
    }>(url, { silent: true });
    if (!result.ok) return;
    setCourses(result.data.courses ?? []);
    setLecturers(result.data.lecturers ?? []);
    setStudents(result.data.students ?? []);
  };

  useEffect(() => {
    void load();
    void loadOptions();
    const timer = window.setInterval(() => void load(true), LIST_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!courseId) {
      setStudents([]);
      return;
    }
    void loadOptions(courseId);
    const course = courses.find((item) => item.id === courseId);
    if (course?.lecturerId) {
      setLecturerId(course.lecturerId);
    }
  }, [courseId]);

  const scheduleClass = async (event: FormEvent) => {
    event.preventDefault();
    const result = await requestApi("/api/admin/live-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, lecturerId, title, startTime, endTime: endTime || undefined }),
      silent: true,
    });
    if (!result.ok) {
      await showError("Could not schedule class", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Virtual Room scheduled", "Supervise the session when it goes live.");
    setTitle("");
    setEndTime("");
    void load();
  };

  const cancelClass = async (classId: string) => {
    const result = await requestApi(`/api/admin/live-classes/${classId}`, { method: "DELETE", silent: true });
    if (!result.ok) {
      await showError("Could not cancel class", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Class cancelled");
    void load();
  };

  const liveNow = classes.filter((item) => item.status === "LIVE");
  const upcoming = classes.filter((item) => item.status !== "LIVE");

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[#003B8E]/15 bg-gradient-to-br from-[#003B8E] to-[#002a66] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <TransitLogo size="md" variant="light" showText={false} />
          <div>
            <h1 className="text-2xl font-semibold">Admin Virtual Room</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/80">
              Schedule sessions, assign a lecturer and course, then supervise live classes — monitor attendance and
              end sessions without joining as a student.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={scheduleClass} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Schedule a Virtual Room</h2>
        <p className="mt-1 text-sm text-slate-500">Enrolled students in the selected course can join when the class is live.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Class title"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseCode} — {course.courseTitle} ({course.studentCount} students)
              </option>
            ))}
          </select>
          <select
            value={lecturerId}
            onChange={(e) => setLecturerId(e.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select lecturer</option>
            {lecturers.map((lecturer) => (
              <option key={lecturer.id} value={lecturer.id}>
                {lecturer.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime || undefined}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-[#003B8E] px-4 py-2 text-sm font-medium text-white hover:bg-[#002f70]"
          >
            Schedule
          </button>
        </div>
        {courseId && students.length > 0 ? (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Students who can join ({students.length})</p>
            <p className="mt-1 text-xs text-slate-500">
              {students
                .slice(0, 8)
                .map((s) => s.fullName)
                .join(" · ")}
              {students.length > 8 ? ` · +${students.length - 8} more` : ""}
            </p>
          </div>
        ) : courseId ? (
          <p className="mt-3 text-sm text-amber-700">No students enrolled in this course yet.</p>
        ) : null}
      </form>

      {liveNow.length > 0 ? (
        <section className="overflow-hidden rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-white shadow-sm">
          <div className="border-b border-red-100 bg-red-600 px-5 py-3">
            <h2 className="text-lg font-semibold text-white">Live Virtual Rooms</h2>
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
                    {item.course?.courseCode} · Lecturer: {item.lecturerName ?? "—"}
                  </p>
                </div>
                <Link
                  href={`/admin/live-classes/${item.id}`}
                  className="rounded-lg bg-[#003B8E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002f70]"
                >
                  Supervise session
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-medium text-slate-900">Scheduled classes</h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-500">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No scheduled classes.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{item.title ?? "Live session"}</p>
                    {statusPill(item.status)}
                  </div>
                  <p className="text-sm text-slate-500">
                    {item.course?.courseCode} · Lecturer: {item.lecturerName ?? "—"}
                  </p>
                  <p className="text-xs text-slate-400">{formatScheduleRange(item.startTime, item.endTime)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/live-classes/${item.id}`}
                    className="rounded-md bg-[#003B8E] px-3 py-2 text-sm font-medium text-white hover:bg-[#002f70]"
                  >
                    Supervise
                  </Link>
                  <button
                    type="button"
                    onClick={() => void cancelClass(item.id)}
                    className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
