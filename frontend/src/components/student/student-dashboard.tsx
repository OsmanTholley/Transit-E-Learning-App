"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStudentSession } from "@/contexts/student-session-context";

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

function StatCard({
  label,
  value,
  sub,
  iconBg,
  children,
}: {
  label: string;
  value: string;
  sub: string;
  iconBg: string;
  children: ReactNode;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{children}</div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </article>
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
    return <p className="text-sm text-slate-500">Loading your dashboard...</p>;
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
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Welcome back, {profile.fullName}
          </h1>
          <p className="mt-1 text-sm font-medium text-[#0B3D91]">{profile.studentId}</p>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Here&apos;s what&apos;s happening in your learning journey today.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Courses" value={String(stats.activeCourses)} sub="Active Courses" iconBg="bg-blue-50 text-blue-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </StatCard>
        <StatCard label="Assignments" value={String(stats.assignmentsDue)} sub="Due Soon" iconBg="bg-teal-50 text-teal-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </StatCard>
        <StatCard label="Quiz Average" value={`${stats.quizAverage}%`} sub="This Semester" iconBg="bg-amber-50 text-amber-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
          </svg>
        </StatCard>
        <Link href="/student/notifications" className="block transition hover:opacity-95">
          <StatCard
            label="Notices"
            value={String(stats.newNotifications)}
            sub="Unread messages"
            iconBg="bg-rose-50 text-rose-500"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </StatCard>
        </Link>
      </section>

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
