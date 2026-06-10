"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { FormEvent, useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/swal";
import { useApiLoad } from "@/hooks/use-api-load";

type Announcement = {
  id: string;
  title: string;
  message: string;
  portal: "Students" | "Lecturers";
  audience: string;
  recipients: number;
  sentBy: string;
  sentAt: string;
};

type BroadcastData = {
  announcements: Announcement[];
  stats: { studentBroadcasts: number; lecturerBroadcasts: number; total: number };
};

type TargetOption = { id: string; label: string };

export function AdminAnnouncementsPage() {
  const { data, loading, reload } = useApiLoad<BroadcastData>("/api/admin/broadcasts", {
    errorTitle: "Could not load announcements",
  });

  const [portal, setPortal] = useState<"students" | "lecturers">("students");
  const [audienceType, setAudienceType] = useState("all");
  const [targetId, setTargetId] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [departments, setDepartments] = useState<TargetOption[]>([]);
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/students/options", { credentials: "include" }).then((r) => r.json()),
    ]).then(([deptData, optData]) => {
      if (Array.isArray(deptData.departments)) {
        setDepartments(deptData.departments.map((d: { id: string; departmentName: string }) => ({
          id: d.id,
          label: d.departmentName,
        })));
      }
      if (Array.isArray(optData.years)) {
        setYears(optData.years);
      }
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portal,
          title,
          message,
          audienceType,
          targetId: targetId || null,
          targetValue: targetValue || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Send failed");

      setTitle("");
      setMessage("");
      await showSuccess("Announcement sent", result.message);
      reload();
    } catch (err) {
      await showError("Send failed", err instanceof Error ? err.message : "Could not send announcement.");
    } finally {
      setSending(false);
    }
  }

  const studentAudienceOptions = [
    { value: "all", label: "All students" },
    { value: "department", label: "By department" },
    { value: "year", label: "By year level" },
  ];

  const lecturerAudienceOptions = [
    { value: "all", label: "All lecturers" },
    { value: "department", label: "By department" },
  ];

  const audienceOptions = portal === "students" ? studentAudienceOptions : lecturerAudienceOptions;

  return (
    <div className="space-y-6">
      {/* <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">System</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Announcements</h1>
        <p className="mt-1 text-sm text-slate-500">Broadcast messages to students and lecturers — stored in the database.</p>
      </div> */}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="portal-card p-4">
          <p className="text-xs text-slate-500">Total sent</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data?.stats.total ?? "—"}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs text-slate-500">Student broadcasts</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{data?.stats.studentBroadcasts ?? "—"}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs text-slate-500">Lecturer broadcasts</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">{data?.stats.lecturerBroadcasts ?? "—"}</p>
        </article>
      </div>

      <section className="portal-card p-5">
        <h2 className="text-sm font-bold text-slate-900">Create announcement</h2>
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Portal</span>
              <select
                value={portal}
                onChange={(e) => {
                  setPortal(e.target.value as "students" | "lecturers");
                  setAudienceType("all");
                  setTargetId("");
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
              >
                <option value="students">Students</option>
                <option value="lecturers">Lecturers</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Audience</span>
              <select
                value={audienceType}
                onChange={(e) => {
                  setAudienceType(e.target.value);
                  setTargetId("");
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
              >
                {audienceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {audienceType === "department" ? (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Department</span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white text-black px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {portal === "students" && audienceType === "year" ? (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Year level</span>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="">Select year…</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="portal-accent-btn w-fit rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send announcement"}
          </button>
        </form>
      </section>

      <section className="portal-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Sent announcements</h2>
        </div>
        {loading && !data ? (
          <LoadingState message="Loading…" layout="compact" className="p-5" />
        ) : !data?.announcements.length ? (
          <p className="p-5 text-sm text-slate-500">No announcements sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Portal</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Recipients</th>
                  <th className="px-4 py-3">Sent by</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.announcements.map((row) => (
                  <tr key={row.id} className="bg-white">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
                    <td className="px-4 py-3 text-slate-600">{row.portal}</td>
                    <td className="px-4 py-3 text-slate-600">{row.audience}</td>
                    <td className="px-4 py-3">{row.recipients}</td>
                    <td className="px-4 py-3 text-slate-600">{row.sentBy}</td>
                    <td className="px-4 py-3 text-slate-500">{row.sentAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
