"use client";

import Link from "next/link";
import { useApiLoad } from "@/hooks/use-api-load";
import { DASHBOARD_REFRESH_MS } from "@/lib/silent-refresh";
import {
  DashboardStatCard,
  DashboardStatsGrid,
} from "@/components/ui/dashboard-stat-card";
import { LoadingDashboardSkeleton } from "@/components/ui/loading-indicator";
import type { LecturerDashboardData } from "@/types/lecturer-portal";

export function LecturerDashboard() {
  const { data, loading } = useApiLoad<LecturerDashboardData>("/api/lecturer/dashboard", {
    errorTitle: "check your internet connection and try again",
    refreshIntervalMs: DASHBOARD_REFRESH_MS,
  });

  if (loading && !data) {
    return <LoadingDashboardSkeleton />;
  }

  if (!data) return null;

  const firstName = data.lecturerName.split(" ")[0] ?? "Lecturer";

  const quickLinks = [
    { href: "/lecturer/materials", label: "Materials" },
    { href: "/lecturer/videos", label: "Videos" },
    { href: "/lecturer/quizzes", label: "Quizzes" },
    { href: "/lecturer/assignments", label: "Assignments" },
    { href: "/lecturer/students", label: "Students" },
  ];

  return (
    <div className="space-y-6">
      <section className="portal-card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#0B3D91]/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-4 -bottom-4 h-32 w-32 rounded-full bg-[#FFC107]/10 blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0B3D91" }}>Lecturer Classroom</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Welcome, {firstName}</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Publish materials, run assessments, and track learner progress from your teaching hub.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/lecturer/courses" className="portal-accent-btn inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm">
            My courses
          </Link>
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex rounded-xl border border-[#dce6f4] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B3D91] hover:bg-[#f0f4fb]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <DashboardStatsGrid columns={6}>
        <DashboardStatCard
          label="Courses"
          value={data.stats.coursesManaged}
          subtitle="Managed"
          tone="blue"
          icon="courses"
        />
        <DashboardStatCard
          label="Grading"
          value={data.stats.pendingGrading}
          subtitle="Pending"
          tone="amber"
          icon="grades"
        />
        <DashboardStatCard
          label="Notes"
          value={data.stats.notesUploaded}
          subtitle="Uploaded"
          tone="emerald"
          icon="notes"
        />
        <DashboardStatCard
          label="Videos"
          value={data.stats.videosUploaded}
          subtitle="Published"
          tone="violet"
          icon="videos"
        />
        <DashboardStatCard
          label="Quizzes"
          value={data.stats.quizzesCreated}
          subtitle="Created"
          tone="indigo"
          icon="quizzes"
        />
        <DashboardStatCard
          label="Assignments"
          value={data.stats.assignmentsCount}
          subtitle="Total"
          tone="teal"
          icon="assignments"
        />
      </DashboardStatsGrid>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-bold text-slate-900">Your courses</h2>
        </div>
        <div className="overflow-x-auto-touch p-4 sm:p-5">
          {data.recentCourses.length === 0 ? (
            <p className="text-sm text-slate-500">No courses assigned yet. Contact the administrator.</p>
          ) : (
            <table className="min-w-[520px] w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Code</th>
                  <th className="px-3 py-2.5">Title</th>
                  <th className="px-3 py-2.5">Students</th>
                  <th className="px-3 py-2.5">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium">{course.code}</td>
                    <td className="px-3 py-2.5 text-slate-700">{course.title}</td>
                    <td className="px-3 py-2.5">{course.students}</td>
                    <td className="px-3 py-2.5 text-slate-500">{course.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
