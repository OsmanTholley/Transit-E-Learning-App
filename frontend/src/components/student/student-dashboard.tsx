"use client";

import Image from "next/image";
import Link from "next/link";
import { useStudentSession } from "@/contexts/student-session-context";
import {
  DashboardStatCard,
  DashboardStatsGrid,
} from "@/components/ui/dashboard-stat-card";

function CourseThumbnail({ type }: { type: string }) {
  const base = "flex h-full w-full items-center justify-center text-white/90";
  if (type === "code") {
    return (
      <div className={base}>
        <span className="font-mono text-lg font-bold opacity-90">{`</>`}</span>
      </div>
    );
  }
  if (type === "database") {
    return (
      <div className={`${base} gap-1`}>
        <div className="h-8 w-5 rounded-t-full bg-white/30" />
        <div className="h-10 w-6 rounded-t-full bg-white/40" />
        <div className="h-6 w-4 rounded-t-full bg-white/25" />
      </div>
    );
  }
  if (type === "engineering") {
    return (
      <div className={base}>
        <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="8" y="8" width="32" height="32" rx="4" />
          <path d="M16 24h16M24 16v16" />
        </svg>
      </div>
    );
  }
  return (
    <div className={base}>
      <span className="text-2xl font-bold">∑</span>
    </div>
  );
}

function FileIcon({ type }: { type: "pdf" | "doc" }) {
  const color = type === "pdf" ? "text-rose-500 bg-rose-50" : "text-blue-500 bg-blue-50";
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4z" />
      </svg>
    </span>
  );
}

export function StudentDashboard() {
  const { data, loading, error } = useStudentSession();

  if (loading) {
    return <p className="text-sm text-slate-500">Loading Student dashboard...</p>;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
        {error ?? "Unable to load dashboard."}
      </div>
    );
  }

  const { profile, stats, courses, upcomingAssignments, recentLectureNotes } = data;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 md:p-8">
       <div className="relative z-10 max-w-xl rounded-2xl bg-gradient-to-r 
                from-[#e8f4ff] to-[#d2f0e5]      /* light gradient */ 
                dark:from-[#1e2a3b] dark:to-[#152f35]  /* dark‑mode version */
                p-6 shadow-lg ring-1 ring-slate-200/50 
                dark:ring-slate-700/50 
                backdrop-blur-sm   /* optional glass‑morphism */
                "> {/* ---------- Header ---------- */}
          <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
            Welcome back, {profile.fullName}
          </h1>

          {/* ---------- Student‑ID (brand blue) ---------- */}
          <p className="mt-1 text-sm font-medium text-transitBlue dark:text-transitBlueDark">
            {profile.studentId}
          </p>

          {/* ---------- Motivational copy ---------- */}
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            <span className="font-semibold text-transitBlue dark:text-transitBlueDark">
              Your adventure
            </span>{" "}
            is kicking off — discover today’s breakthroughs in your learning journey at{" "}
            <span className="font-semibold text-transitBlue dark:text-transitBlueDark">
              Transit College S/L
            </span>
            !
          </p>
        </div>

        <div className="pointer-events-none absolute -right-4 bottom-0 top-0 hidden w-[280px] md:block lg:w-[320px]">
          <div className="absolute right-8 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#FFC107]/20" />
          <div className="absolute right-16 top-8 h-3 w-3 rounded-full bg-[#FFC107]" />
          <div className="absolute right-32 bottom-12 h-2 w-2 rounded-full bg-[#0B3D91]/20" />
          <Image
            src="/images/student-hero.png"
            alt=""
            width={280}
            height={280}
            className="relative z-10 h-full w-full object-contain object-bottom"
            priority
          />
        </div>
      </section>

      <DashboardStatsGrid columns={4}>
        <DashboardStatCard
          label="My Courses"
          value={stats.activeCourses}
          subtitle="Active courses"
          tone="blue"
          icon="courses"
        />
        <DashboardStatCard
          label="Assignments"
          value={stats.assignmentsDue}
          subtitle="Due soon"
          tone="teal"
          icon="assignments"
        />
        <DashboardStatCard
          label="Quiz Average"
          value={`${stats.quizAverage}%`}
          subtitle="This semester"
          tone="amber"
          icon="quizzes"
        />
        <DashboardStatCard
          label="Notices"
          value={stats.newNotifications}
          subtitle="Unread messages"
          tone="rose"
          icon="notifications"
          href="/student/notifications"
        />
      </DashboardStatsGrid>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
          <div className="flex gap-4">
            <Link href="/student/courses" className="text-sm font-semibold text-[#0B3D91] hover:underline">
              My Courses
            </Link>
            <Link href="/student/lecture-notes" className="text-sm font-semibold text-[#0B3D91] hover:underline">
              Lecture Notes
            </Link>
          </div>
        </div>
        {courses.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            You are not enrolled in any courses yet. Contact your administrator.
          </p>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/student/courses/${course.id}`}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md block"
            >
              <div className="relative">
                <div className={`h-32 bg-gradient-to-br ${course.thumbnailBg}`}>
                  <CourseThumbnail type={course.thumbnail} />
                </div>
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-slate-600 shadow-sm hover:bg-white"
                  aria-label="Course options"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{course.title}</h3>
                <p className="text-xs text-slate-500">{course.code}</p>
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        course.progress >= 100 ? "bg-emerald-500" : "bg-[#FFC107]"
                      }`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-xs font-medium text-slate-500">
                    {course.progress >= 100 ? "Complete" : `${course.progress}% Complete`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Upcoming Assignments</h2>
          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming assignments.</p>
          ) : (
          <ul className="divide-y divide-slate-100">
            {upcomingAssignments.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <FileIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.course}</p>
                </div>
                <p className="shrink-0 text-xs font-medium text-rose-500">Due: {item.dueDate}</p>
              </li>
            ))}
          </ul>
          )}
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Recent Lecture Notes</h2>
          {recentLectureNotes.length === 0 ? (
            <p className="text-sm text-slate-500">No lecture notes available yet.</p>
          ) : (
          <ul className="divide-y divide-slate-100">
            {recentLectureNotes.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <FileIcon type="pdf" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/student/lecture-notes/view/${item.id}`}
                    className="truncate font-medium text-slate-900 hover:text-[#0B3D91] hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-slate-500">{item.course}</p>
                </div>
                <Link
                  href={`/student/lecture-notes/view/${item.id}`}
                  className="shrink-0 text-xs font-semibold text-[#0B3D91] hover:underline"
                >
                  {item.format}
                </Link>
              </li>
            ))}
          </ul>
          )}
        </article>
      </section>
    </div>
  );
}
