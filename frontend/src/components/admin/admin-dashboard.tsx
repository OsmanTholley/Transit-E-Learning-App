"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LecturerPerformanceOverview } from "@/components/admin/lecturer-performance-overview";
import {
  DashboardStatCard,
  DashboardStatsGrid,
} from "@/components/ui/dashboard-stat-card";
import type { StatIconName } from "@/components/ui/stat-icon";
import { useApiLoad } from "@/hooks/use-api-load";
import type { AdminDashboardData } from "@/types/admin-dashboard";

type StatCard = {
  label: string;
  value: string;
  deltaLabel?: string;
  tone?: "amber" | "blue" | "indigo" | "violet" | "slate";
};

const toneStyles: Record<NonNullable<StatCard["tone"]>, { icon: string; dot: string }> = {
  amber: { icon: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
  blue: { icon: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  indigo: { icon: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500" },
  violet: { icon: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  slate: { icon: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
};

const adminStatIcons: Record<NonNullable<StatCard["tone"]>, StatIconName> = {
  amber: "lecturers",
  blue: "students",
  indigo: "courses",
  violet: "users",
  slate: "notifications",
};

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

type AdminDashboardProps = {
  adminName: string;
};

export function AdminDashboard({ adminName }: AdminDashboardProps) {
  const { data, loading } = useApiLoad<AdminDashboardData>("/api/admin/dashboard", {
    errorTitle: "Could not load dashboard",
  });

  const firstName = adminName.split(" ")[0] ?? "Admin";

  if (loading && !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats: StatCard[] = [
    {
      label: "Total Students",
      value: data.stats.totalStudents.toLocaleString(),
      tone: "blue",
    },
    {
      label: "Total Lecturers",
      value: data.stats.totalLecturers.toLocaleString(),
      tone: "amber",
    },
    {
      label: "Active Courses",
      value: data.stats.activeCourses.toLocaleString(),
      tone: "indigo",
    },
    {
      label: "Active Users",
      value: data.stats.activeUsers.toLocaleString(),
      tone: "violet",
    },
    {
      label: "Pending Approvals",
      value: data.stats.pendingApprovals.toLocaleString(),
      tone: "slate",
    },
  ];

  const quickActions = [
    { label: "Add Student", href: "/admin/students/add", desc: "Register admitted learners" },
    { label: "Verify Students", href: "/admin/students/verify", desc: "Approve ID registrations" },
    { label: "Add Lecturer", href: "/admin/lecturers/add", desc: "Onboard teaching staff" },
    { label: "Content Approval", href: "/admin/content/approval", desc: "Review uploaded materials" },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-[#0c1222] to-slate-900 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-16 h-32 w-32 rounded-full bg-yellow-400/15 blur-2xl" />
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Administration Overview</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Good day, {firstName}</h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Monitor platform health, manage academic operations, and keep Transit College S/L E-Learning running smoothly.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/admin/students/all"
              className="rounded-lg border-2 border-yellow-600 bg-yellow-500 px-4 py-2 text-sm font-semibold text-[#003B8E] shadow-lg shadow-yellow-800/30 hover:bg-yellow-400"
            >
              Manage students
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/15"
            >
              View reports
            </Link>
          </div>
        </div>
      </section>

      <DashboardStatsGrid columns={5}>
        {stats.map((stat) => (
          <DashboardStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            subtitle={stat.deltaLabel}
            tone={stat.tone ?? "amber"}
            icon={adminStatIcons[stat.tone ?? "amber"]}
          />
        ))}
      </DashboardStatsGrid>

      <Panel
        title="Course years overview"
        right={
          <Link href="/admin/courses/all" className="text-xs font-semibold text-yellow-700 hover:underline">
            Manage courses
          </Link>
        }
      >
        <div id="course-years" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.coursesByLevel.map((row) => (
            <article
              key={row.level}
              className="rounded-xl border border-slate-200/80 border-l-4 border-l-amber-400 bg-slate-50/50 p-4"
            >
              <p className="text-2xl font-bold text-slate-900">{row.level}</p>
              <p className="mt-1 text-sm text-slate-500">
                {row.count} course{row.count === 1 ? "" : "s"}
              </p>
            </article>
          ))}
        </div>
      </Panel>

      <LecturerPerformanceOverview performance={data.lecturerPerformance} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-yellow-300 hover:shadow-md"
          >
            <p className="text-sm font-bold text-slate-900 group-hover:text-yellow-800">{action.label}</p>
            <p className="mt-1 text-xs text-slate-500">{action.desc}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent activity"
          right={
            <Link href="/admin/activity-logs" className="text-xs font-semibold text-yellow-700 hover:underline">
              View all
            </Link>
          }
        >
          {data.activities.length === 0 ? (
            <p className="text-sm text-slate-500">No recent activity yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.activities.map((a) => {
                const activityTone =
                  a.tone === "emerald" ? "amber" : (a.tone as StatCard["tone"] | undefined);
                const t = toneStyles[activityTone ?? "amber"] ?? toneStyles.amber;
                return (
                  <li key={`${a.title}-${a.subtitle}-${a.when}`} className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.dot}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                        <p className="text-xs text-slate-500">{a.subtitle}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{a.when}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="User distribution">
          <div className="space-y-4">
            {data.userDistribution.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{row.label}</span>
                  <span className="text-slate-500">
                    {row.pct}% ({row.count})
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      row.label === "Students"
                        ? "bg-blue-600"
                        : row.label === "Lecturers"
                          ? "bg-yellow-500"
                          : "bg-slate-600"
                    }`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent students"
        right={
          <Link href="/admin/students/all" className="text-xs font-semibold text-yellow-700 hover:underline">
            View all
          </Link>
        }
      >
        {data.recentStudents.length === 0 ? (
          <p className="text-sm text-slate-500">No students registered yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl ring-1 ring-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="hidden px-3 py-2.5 md:table-cell">Program</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentStudents.map((s) => (
                  <tr key={s.id} className="bg-white">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-slate-800">{s.studentId}</td>
                    <td className="px-3 py-2.5 text-slate-700">{s.name}</td>
                    <td className="hidden px-3 py-2.5 text-slate-500 md:table-cell">{s.program}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s.status === "Active"
                            ? "bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200"
                            : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
