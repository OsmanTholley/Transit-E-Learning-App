"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { TransitLogo } from "@/components/brand/transit-logo";
import { requestApi } from "@/lib/fetch-api";
import { scheduleEffectWork } from "@/lib/react-effect-utils";
import { showError, showSuccess } from "@/lib/swal";

type LiveClassAudience = "GENERAL" | "STUDENTS" | "LECTURERS";

type LiveClassItem = {
  id: string;
  title: string | null;
  description: string | null;
  audience: LiveClassAudience;
  status: string;
  startTime: string | null;
  endTime: string | null;
  course: { courseCode: string; courseTitle: string } | null;
  lecturerName?: string | null;
};

const LIST_REFRESH_MS = 15_000;

const audienceLabels: Record<LiveClassAudience, string> = {
  GENERAL: "General (students & lecturers)",
  STUDENTS: "Students only",
  LECTURERS: "Lecturers only",
};

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

function toLocalInput(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function AdminLiveClassesHub() {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<LiveClassAudience>("GENERAL");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAudience, setEditAudience] = useState<LiveClassAudience>("GENERAL");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const result = await requestApi<{ classes: LiveClassItem[] }>("/api/admin/live-classes", { silent: true });
    if (!silent) setLoading(false);
    if (result.ok) setClasses(result.data.classes);
  };

  useEffect(() => {
    scheduleEffectWork(() => load());
    const timer = window.setInterval(() => void load(true), LIST_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAudience("GENERAL");
    setEndTime("");
  };

  const scheduleClass = async (event: FormEvent) => {
    event.preventDefault();
    const result = await requestApi("/api/admin/live-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        audience,
        startTime,
        endTime: endTime || undefined,
      }),
      silent: true,
    });
    if (!result.ok) {
      await showError("Could not schedule class", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Virtual Room scheduled", "Start the session when you are ready to go live.");
    resetForm();
    void load();
  };

  const openEdit = (item: LiveClassItem) => {
    setEditingId(item.id);
    setEditTitle(item.title ?? "");
    setEditDescription(item.description ?? "");
    setEditAudience(item.audience);
    setEditStartTime(toLocalInput(item.startTime));
    setEditEndTime(toLocalInput(item.endTime));
  };

  const saveEdit = async (classId: string) => {
    const result = await requestApi(`/api/admin/live-classes/${classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        title: editTitle,
        description: editDescription,
        audience: editAudience,
        startTime: editStartTime,
        endTime: editEndTime || null,
      }),
      silent: true,
    });
    if (!result.ok) {
      await showError("Could not update class", result.offline ? "You are offline." : result.message);
      return;
    }
    await showSuccess("Session updated");
    setEditingId(null);
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
              Schedule platform-wide sessions by audience, add a meeting description, and supervise live classes.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={scheduleClass} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Schedule a Virtual Room</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose who can join, describe the meeting, and set the schedule. You supervise as administrator.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Meeting description (agenda, notes for participants)"
            rows={3}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as LiveClassAudience)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="GENERAL">{audienceLabels.GENERAL}</option>
            <option value="STUDENTS">{audienceLabels.STUDENTS}</option>
            <option value="LECTURERS">{audienceLabels.LECTURERS}</option>
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
            className="rounded-md bg-[#003B8E] px-4 py-2 text-sm font-medium text-white hover:bg-[#002f70] md:col-span-2 md:w-fit"
          >
            Schedule
          </button>
        </div>
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
                  <p className="text-sm text-slate-600">{audienceLabels[item.audience]}</p>
                  {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
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
              <div key={item.id} className="px-5 py-4">
                {editingId === item.id ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                    />
                    <select
                      value={editAudience}
                      onChange={(e) => setEditAudience(e.target.value as LiveClassAudience)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="GENERAL">{audienceLabels.GENERAL}</option>
                      <option value="STUDENTS">{audienceLabels.STUDENTS}</option>
                      <option value="LECTURERS">{audienceLabels.LECTURERS}</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="datetime-local"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      min={editStartTime || undefined}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(item.id)}
                        className="rounded-md bg-[#003B8E] px-3 py-2 text-sm font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
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
                      <p className="text-sm text-slate-500">{audienceLabels[item.audience]}</p>
                      {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
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
                        Cancel
                      </button>
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
