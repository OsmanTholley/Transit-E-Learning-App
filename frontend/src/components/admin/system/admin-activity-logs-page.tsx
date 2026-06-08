"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useCallback, useEffect, useState } from "react";

type ActivityLogRow = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  actorName: string;
  actorRole: string;
  actorEmail: string | null;
  createdAt: string;
};

type ActionCount = { action: string; count: number };

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Sign in",
  "auth.logout": "Sign out",
  "announcement.sent": "Announcement",
  "student.updated": "Student update",
  "student.created": "Student registered",
  "student.admitted": "Student admitted",
  "settings.updated": "Settings",
};

const ACTION_STYLES: Record<string, string> = {
  "auth.login": "bg-violet-50 text-violet-800 ring-violet-200",
  "auth.logout": "bg-slate-100 text-slate-700 ring-slate-200",
  "announcement.sent": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "student.updated": "bg-blue-50 text-blue-800 ring-blue-200",
  "student.created": "bg-sky-50 text-sky-800 ring-sky-200",
  "student.admitted": "bg-indigo-50 text-indigo-800 ring-indigo-200",
  "settings.updated": "bg-amber-50 text-amber-800 ring-amber-200",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/\./g, " · ");
}

function actionStyle(action: string) {
  return ACTION_STYLES[action] ?? "bg-slate-50 text-slate-700 ring-slate-200";
}

export function AdminActivityLogsPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [actionCounts, setActionCounts] = useState<ActionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "150" });
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/activity-logs?${params}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs ?? []);
        setActionCounts(data.actionCounts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function clearLogs() {
    setClearing(true);
    try {
      await fetch("/api/admin/activity-logs", {
        method: "DELETE",
        credentials: "include",
      });
      setLogs([]);
      setActionCounts([]);
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  }

  const loginCount = actionCounts.find((r) => r.action === "auth.login")?.count ?? 0;
  const logoutCount = actionCounts.find((r) => r.action === "auth.logout")?.count ?? 0;
  const totalEvents = actionCounts.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">System</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Activity Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Audit sign-ins, sign-outs, announcements, student changes, and other platform events.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {confirmClear ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm shadow-sm">
              <span className="font-medium text-rose-800">Delete all logs permanently?</span>
              <button
                type="button"
                onClick={() => void clearLogs()}
                disabled={clearing}
                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {clearing ? "Clearing…" : "Yes, clear"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Clear All Logs
            </button>
          )}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total events</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalEvents}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sign-ins logged</p>
          <p className="mt-1 text-2xl font-bold text-violet-700">{loginCount}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sign-outs logged</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{logoutCount}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Event types</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{actionCounts.length}</p>
        </article>
      </section>

      <section className="portal-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-slate-900">Audit trail</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-slate-500" htmlFor="activity-filter">
              Filter
            </label>
            <select
              id="activity-filter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
            >
              <option value="">All events</option>
              <option value="auth.login">Sign in</option>
              <option value="auth.logout">Sign out</option>
              <option value="announcement.sent">Announcements</option>
              <option value="student.admitted">Student admitted</option>
              <option value="student.created">Student registered</option>
              <option value="student.updated">Student updated</option>
              <option value="settings.updated">Settings</option>
            </select>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <LoadingState message="Loading activity logs…" layout="compact" className="p-5" />
        ) : logs.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No activity logs yet. Sign in/out, student updates, announcements, and settings changes will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="bg-white hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${actionStyle(log.action)}`}
                      >
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-700">{log.summary ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p className="font-medium">{log.actorName}</p>
                      <p className="text-xs text-slate-400">
                        {log.actorRole}
                        {log.actorEmail ? ` · ${log.actorEmail}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.entityType ?? "—"}
                      {log.entityId ? (
                        <span className="ml-1 font-mono text-xs text-slate-400">
                          {log.entityId.slice(0, 8)}…
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
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
