"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useApiLoad } from "@/hooks/use-api-load";

type AdminNotificationsData = {
  stats: { total: number; unread: number; read: number };
  notifications: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    userName: string;
    userEmail: string;
    userRole: string;
    createdAt: string;
    readAt: string | null;
  }[];
};

export function AdminNotificationsPage() {
  const { data, loading } = useApiLoad<AdminNotificationsData>("/api/admin/notifications", {
    errorTitle: "Could not load notifications",
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">System</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">All platform notifications delivered to users — from the database.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="portal-card p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold">{data?.stats.total ?? "—"}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs text-slate-500">Unread</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{data?.stats.unread ?? "—"}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs text-slate-500">Read</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{data?.stats.read ?? "—"}</p>
        </article>
      </div>

      <section className="portal-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Recent notifications</h2>
        </div>
        {loading && !data ? (
          <LoadingState message="Loading…" layout="compact" className="p-5" />
        ) : !data?.notifications.length ? (
          <p className="p-5 text-sm text-slate-500">No notifications in the system yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.notifications.map((n) => (
                  <tr key={n.id} className="bg-white">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{n.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{n.message}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{n.userName}</td>
                    <td className="px-4 py-3 text-slate-600">{n.userRole}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          n.isRead
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
                        }`}
                      >
                        {n.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{n.createdAt}</td>
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
