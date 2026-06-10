"use client";

import Link from "next/link";
import { DashboardCalendarWidget } from "@/components/academic-calendar/dashboard-calendar-widget";
import { useStudentSession } from "@/contexts/student-session-context";
import { LoadingDashboardSkeleton } from "@/components/ui/loading-indicator";
import {
  DashboardStatCard,
  DashboardStatsGrid,
} from "@/components/ui/dashboard-stat-card";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { NewUpload } from "@/services/student-dashboard-data";

/* ── helpers ────────────────────────────────────────────────────── */
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

/* ── relative time ──────────────────────────────────────────────── */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ── type badge ─────────────────────────────────────────────────── */
function UploadBadge({ type }: { type: "note" | "video" }) {
  if (type === "video") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
          <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
        Video
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM7 13h10v1H7zm0 3h7v1H7z" />
      </svg>
      Note
    </span>
  );
}

/* ── single upload card ─────────────────────────────────────────── */
function UploadCard({ item }: { item: NewUpload }) {
  return (
    <Link
      href={item.href}
      className="group flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-[#0B3D91]/20 hover:shadow-md"
    >
      {/* Lecturer avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-sm" style={{ background: "linear-gradient(135deg, #0B3D91 0%, #1a56c4 100%)" }}>
        {item.lecturerInitials}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <UploadBadge type={item.type} />
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            {item.courseCode}
          </span>
        </div>
        <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 group-hover:text-[#0B3D91]">
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{item.lecturerName}</span>
          <span>·</span>
          <span>{item.course}</span>
        </div>
      </div>

      {/* Time */}
      <div className="shrink-0 text-right">
        <span className="text-[10px] font-medium text-slate-400">{relativeTime(item.uploadedAt)}</span>
        <div className="mt-1.5 flex justify-end">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B3D91]/8 text-[#0B3D91] opacity-0 transition-opacity group-hover:opacity-100">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── NEW UPLOADS SECTION ────────────────────────────────────────── */
function NewUploadsSection({ uploads }: { uploads: NewUpload[] }) {
  if (uploads.length === 0) {
    return (
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">What&apos;s New</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-400">0</span>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-400">No new materials uploaded yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">What&apos;s New</h2>
          {/* Pulse dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#FFC107" }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "#FFC107" }} />
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "#fff8e1", color: "#0B3D91" }}>
            {uploads.length} new
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/student/lecture-notes" className="text-sm font-semibold text-[#0B3D91] hover:underline">
            All Notes
          </Link>
          <Link href="/student/video-lessons" className="text-sm font-semibold text-[#0B3D91] hover:underline">
            All Videos
          </Link>
        </div>
      </div>

      {/* Two-column grid on md+ */}
      <div className="grid gap-3 md:grid-cols-2">
        {uploads.map((item) => (
          <UploadCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export function StudentDashboard() {
  const { data, loading, error } = useStudentSession();

  if (loading) {
    return <LoadingDashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
        {error ?? "Unable to load dashboard."}
      </div>
    );
  }

  const { profile, stats, courses, upcomingAssignments, recentLectureNotes, newUploads } = data;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="portal-card relative overflow-hidden p-6 md:p-8" style={{ background: "linear-gradient(135deg, #0B3D91 0%, #1045b8 60%, #082d6e 100%)" }}>
        {/* Yellow accent stripe at top */}
        <div className="absolute left-0 right-0 top-0 h-1" style={{ background: "#FFC107" }} />

        <div className="relative z-10 max-w-xl rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider" style={{ background: "#FFC107", color: "#0B3D91" }}>
            Student Portal
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Welcome back, {profile.fullName}</h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: "#FFC107" }}>{profile.studentId}</p>
          <p className="mt-2 text-sm text-white/80 md:text-base">
            Continue your learning journey — access courses, notes, quizzes, and live classroom resources.
          </p>
        </div>

        <div className="pointer-events-none absolute -right-2 bottom-0 top-0 hidden items-center justify-center md:flex md:w-[240px] lg:w-[280px]">
          <div className="absolute right-10 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full" style={{ background: "rgba(255,193,7,0.12)" }} />
          <div className="absolute right-20 top-10 h-3 w-3 rounded-full" style={{ background: "#FFC107" }} />
          <div className="absolute right-28 bottom-16 h-2 w-2 rounded-full" style={{ background: "rgba(255,193,7,0.6)" }} />
          <div className="relative z-10">
            <UserAvatar
              fullName={profile.fullName}
              profileImage={profile.profileImage}
              initials={profile.avatarInitials}
              size="xl"
              ring
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <DashboardStatsGrid columns={4}>
        <DashboardStatCard label="My Courses"   value={stats.activeCourses}          subtitle="Active courses"   tone="blue"  icon="courses" />
        <DashboardStatCard label="Assignments"  value={stats.assignmentsDue}          subtitle="Due soon"        tone="teal"  icon="assignments" />
        <DashboardStatCard label="Quiz Average" value={`${stats.quizAverage}%`}       subtitle="This semester"   tone="amber" icon="quizzes" />
        <DashboardStatCard label="Notices"      value={stats.newNotifications}        subtitle="Unread — open bell icon" tone="rose"  icon="notifications" />
      </DashboardStatsGrid>

      <div id="academic-calendar">
        <DashboardCalendarWidget role="student" />
      </div>

      {/* ── WHAT'S NEW ─────────────────────────────────────────── */}
      <NewUploadsSection uploads={newUploads ?? []} />

      {/* My Courses */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
          <div className="flex gap-4">
            <Link href="/student/courses" className="text-sm font-semibold text-[#0B3D91] hover:underline">My Courses</Link>
            <Link href="/student/lecture-notes" className="text-sm font-semibold text-[#0B3D91] hover:underline">Lecture Notes</Link>
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
                className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md"
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
                      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-500">{course.code}</p>
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${course.progress}%`, background: course.progress >= 100 ? "#0B3D91" : "#FFC107" }}
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


      {/* Assignments + Recent Notes */}
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
