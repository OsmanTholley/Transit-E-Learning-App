"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudentSession } from "@/contexts/student-session-context";
import { VideoLesson, LiveClassSession } from "@/types/video-lessons";
import { getVideoLessonsViewTitle } from "@/components/student/video-lessons/video-lessons-nav-config";
import { VideoCard } from "@/components/student/video-lessons/video-ui";

type Props = {
  segment?: string[];
};

type ProgressSnapshot = {
  secondsWatched: number;
  durationSeconds: number;
  updatedAt: string;
};

type HistoryEntry = {
  videoId: string;
  watchedAt: string;
  secondsWatched: number;
  durationSeconds: number;
};

const LS_KEYS = {
  progress: "transit.videoLessons.progress.v1",
  bookmarks: "transit.videoLessons.bookmarks.v1",
  downloads: "transit.videoLessons.downloads.v1",
  history: "transit.videoLessons.history.v1",
} as const;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toPercent(progress: ProgressSnapshot | undefined) {
  if (!progress || progress.durationSeconds <= 0) return 0;
  return clamp(Math.round((progress.secondsWatched / progress.durationSeconds) * 100), 0, 100);
}

function inferDurationSeconds(label: string | null) {
  if (!label) return 0;
  // accepts "25 mins", "25 min", "00:25:10"
  const hhmmss = label.split(":").map((p) => Number(p));
  if (hhmmss.length === 3 && hhmmss.every((n) => Number.isFinite(n))) {
    return hhmmss[0] * 3600 + hhmmss[1] * 60 + hhmmss[2];
  }
  const mins = label.match(/(\d+)\s*m/i);
  if (mins) return Number(mins[1]) * 60;
  return 0;
}

function DashboardStat({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "blue" | "yellow" | "emerald" | "slate";
  icon: React.ReactNode;
}) {
  const toneCls =
    tone === "blue"
      ? "bg-[#0B3D91]/10 text-[#0B3D91]"
      : tone === "yellow"
        ? "bg-[#FFC107]/15 text-[#0B3D91]"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-700";

  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneCls}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </article>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors",
        active
          ? "bg-[#0B3D91] text-white ring-[#0B3D91]"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function VideoFilters({
  query,
  onQuery,
  course,
  courses,
  onCourse,
  status,
  onStatus,
  lecturer,
  lecturers,
  onLecturer,
}: {
  query: string;
  onQuery: (v: string) => void;
  course: string;
  courses: { id: string; code: string; title: string }[];
  onCourse: (v: string) => void;
  status: "all" | "completed" | "in-progress" | "unwatched";
  onStatus: (v: "all" | "completed" | "in-progress" | "unwatched") => void;
  lecturer: string;
  lecturers: string[];
  onLecturer: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 md:grid-cols-12">
      <div className="md:col-span-6">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search videos by topic, course code, lecturer…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-3 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
          />
        </div>
      </div>

      <div className="md:col-span-3">
        <select
          value={course}
          onChange={(e) => onCourse(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.code}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-3">
        <select
          value={lecturer}
          onChange={(e) => onLecturer(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        >
          <option value="">All lecturers</option>
          {lecturers.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-12">
        <div className="flex flex-wrap gap-2">
          <Chip active={status === "all"} onClick={() => onStatus("all")}>
            All
          </Chip>
          <Chip active={status === "in-progress"} onClick={() => onStatus("in-progress")}>
            In progress
          </Chip>
          <Chip active={status === "completed"} onClick={() => onStatus("completed")}>
            Completed
          </Chip>
          <Chip active={status === "unwatched"} onClick={() => onStatus("unwatched")}>
            Unwatched
          </Chip>
          <p className="ml-auto hidden text-xs font-medium text-slate-500 md:block">
            Tip: progress and bookmarks sync locally for now
          </p>
        </div>
      </div>
    </div>
  );
}

export function VideoLessonsHub({ segment }: Props) {
  const view = segment?.[0] ?? "";
  const title = getVideoLessonsViewTitle(view);
  const { data, loading: sessionLoading, error: sessionError } = useStudentSession();

  const [videos, setVideos] = useState<VideoLesson[] | null>(null);
  const [classes, setClasses] = useState<LiveClassSession[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "in-progress" | "unwatched">("all");
  const [lecturer, setLecturer] = useState("");

  const [progressById, setProgressById] = useState<Record<string, ProgressSnapshot>>(() =>
    safeParse<Record<string, ProgressSnapshot>>(typeof window === "undefined" ? null : localStorage.getItem(LS_KEYS.progress), {})
  );
  const [bookmarks, setBookmarks] = useState<Record<string, true>>(() =>
    safeParse<Record<string, true>>(typeof window === "undefined" ? null : localStorage.getItem(LS_KEYS.bookmarks), {})
  );
  const [downloads, setDownloads] = useState<Record<string, { savedAt: string }>>(() =>
    safeParse<Record<string, { savedAt: string }>>(typeof window === "undefined" ? null : localStorage.getItem(LS_KEYS.downloads), {})
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    safeParse<HistoryEntry[]>(typeof window === "undefined" ? null : localStorage.getItem(LS_KEYS.history), [])
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.progress, JSON.stringify(progressById));
  }, [progressById]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.bookmarks, JSON.stringify(bookmarks));
  }, [bookmarks]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.downloads, JSON.stringify(downloads));
  }, [downloads]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.history, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [vRes, cRes] = await Promise.all([
          fetch("/api/student/video-lessons/videos"),
          fetch("/api/student/video-lessons/live-classes"),
        ]);

        const vJson = await vRes.json();
        if (!vRes.ok) throw new Error(vJson?.error ?? "Failed to load videos.");
        const cJson = await cRes.json();
        if (!cRes.ok) throw new Error(cJson?.error ?? "Failed to load live classes.");

        if (!cancelled) {
          setVideos(vJson);
          setClasses(cJson);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load video lessons.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const courses = useMemo(() => {
    const list = data?.courses ?? [];
    return list.map((c) => ({ id: c.id, code: c.code, title: c.title }));
  }, [data?.courses]);

  const lecturers = useMemo(() => {
    if (!videos) return [];
    return Array.from(new Set(videos.map((v) => v.lecturerName))).sort((a, b) => a.localeCompare(b));
  }, [videos]);

  const computed = useMemo(() => {
    const all = videos ?? [];
    const byId = progressById;

    const withComputed = all.map((v) => {
      const snapshot = byId[v.id];
      const inferredDuration = snapshot?.durationSeconds ?? inferDurationSeconds(v.durationLabel);
      const effective: ProgressSnapshot | undefined = snapshot
        ? snapshot
        : inferredDuration > 0
          ? { secondsWatched: 0, durationSeconds: inferredDuration, updatedAt: new Date(0).toISOString() }
          : undefined;
      const pct = toPercent(effective);
      return { v, progress: effective, percent: pct };
    });

    const filtered = withComputed.filter(({ v, percent }) => {
      if (courseCode && v.courseCode !== courseCode) return false;
      if (lecturer && v.lecturerName !== lecturer) return false;

      if (query) {
        const q = query.toLowerCase();
        const blob = `${v.courseCode} ${v.courseTitle} ${v.title} ${v.lecturerName}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }

      if (status === "completed" && percent < 95) return false;
      if (status === "in-progress" && (percent <= 0 || percent >= 95)) return false;
      if (status === "unwatched" && percent > 0) return false;

      return true;
    });

    const continueWatching = filtered
      .filter((x) => x.percent > 0 && x.percent < 95)
      .sort((a, b) => (b.progress?.updatedAt ?? "").localeCompare(a.progress?.updatedAt ?? ""));

    const bookmarked = filtered.filter((x) => bookmarks[x.v.id]);
    const downloaded = filtered.filter((x) => downloads[x.v.id]);

    return { filtered, continueWatching, bookmarked, downloaded, all: withComputed };
  }, [videos, progressById, bookmarks, downloads, courseCode, lecturer, query, status]);

  const stats = useMemo(() => {
    const all = computed.all;
    const total = all.length;
    const completed = all.filter((x) => x.percent >= 95).length;
    const inProgress = all.filter((x) => x.percent > 0 && x.percent < 95).length;
    const avg = total > 0 ? Math.round(all.reduce((s, x) => s + x.percent, 0) / total) : 0;
    const live = (classes ?? []).length;
    return { total, completed, inProgress, avg, live };
  }, [computed.all, classes]);

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  function toggleDownload(id: string) {
    setDownloads((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { savedAt: new Date().toISOString() };
      return next;
    });
  }

  function recordHistory(videoId: string, secondsWatched: number, durationSeconds: number) {
    const entry: HistoryEntry = {
      videoId,
      watchedAt: new Date().toISOString(),
      secondsWatched,
      durationSeconds,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 100));
  }

  function seedProgress(videoId: string, durationSeconds: number) {
    setProgressById((prev) => {
      const existing = prev[videoId];
      const baseDuration = existing?.durationSeconds ?? durationSeconds;
      const secondsWatched = existing?.secondsWatched ?? 0;
      return {
        ...prev,
        [videoId]: {
          secondsWatched,
          durationSeconds: baseDuration,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }

  const visibleList =
    view === "continue"
      ? computed.continueWatching
      : view === "bookmarked"
        ? computed.bookmarked
        : view === "downloaded"
          ? computed.downloaded
          : computed.filtered;

  if (sessionLoading) {
    return <p className="text-sm text-slate-500">Loading your video lessons...</p>;
  }

  if (sessionError) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
        {sessionError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Videos are filtered to your department, program, level, semester, and assigned courses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/student/video-lessons"
            className="rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0B3D91]/90"
          >
            Browse Videos
          </Link>
          <Link
            href="/student/video-lessons/playlists"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Playlists
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="Total Videos"
          value={String(stats.total)}
          sub="Assigned to you"
          tone="blue"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="m10 9 6 4-6 4V9z" />
            </svg>
          }
        />
        <DashboardStat
          label="Completed"
          value={String(stats.completed)}
          sub="Watched lessons"
          tone="emerald"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <DashboardStat
          label="Live Classes"
          value={String(stats.live)}
          sub="Upcoming sessions"
          tone="yellow"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <DashboardStat
          label="Watch Progress"
          value={`${stats.avg}%`}
          sub="Average completion"
          tone="slate"
          icon={
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 3 2 5-6" />
            </svg>
          }
        />
      </section>

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
      ) : null}

      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80"
          >
            Loading your videos…
          </motion.div>
        ) : null}
      </AnimatePresence>

      {view === "live-classes" ? (
        <LiveClassesView classes={classes ?? []} />
      ) : view === "playlists" ? (
        <CoursePlaylistsView
          videos={videos ?? []}
          progressById={progressById}
          onSeedProgress={seedProgress}
          bookmarks={bookmarks}
          onBookmark={toggleBookmark}
        />
      ) : view === "history" ? (
        <WatchHistoryView history={history} videos={videos ?? []} />
      ) : view === "progress" ? (
        <ProgressAnalyticsView videos={videos ?? []} progressById={progressById} />
      ) : view === "recommended" ? (
        <RecommendedView videos={videos ?? []} courses={courses} />
      ) : (
        <>
          <VideoFilters
            query={query}
            onQuery={setQuery}
            course={courseCode}
            courses={courses}
            onCourse={setCourseCode}
            status={status}
            onStatus={setStatus}
            lecturer={lecturer}
            lecturers={lecturers}
            onLecturer={setLecturer}
          />

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleList.length === 0 ? (
              <div className="sm:col-span-2 xl:col-span-3 rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
                No videos match your filters yet.
              </div>
            ) : (
              visibleList.map(({ v, percent, progress }) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <VideoCard
                    video={v}
                    progressPercent={percent}
                    uploadLabel={formatDate(v.createdAt)}
                    isBookmarked={Boolean(bookmarks[v.id])}
                    isDownloaded={Boolean(downloads[v.id])}
                    onBookmark={() => toggleBookmark(v.id)}
                    onDownload={() => toggleDownload(v.id)}
                    onPlay={() => {
                      if (!progress?.durationSeconds) seedProgress(v.id, inferDurationSeconds(v.durationLabel));
                      recordHistory(v.id, progress?.secondsWatched ?? 0, progress?.durationSeconds ?? inferDurationSeconds(v.durationLabel));
                    }}
                  />
                </motion.div>
              ))
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">AI Tutor</h2>
                <p className="text-sm text-slate-500">
                  Ask questions about any video topic (summaries, formulas, step-by-step calculations).
                </p>
              </div>
              <Link
                href="/student/ai-tutor"
                className="inline-flex items-center justify-center rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0B3D91] shadow-sm hover:bg-[#FFC107]/90"
              >
                Open AI Tutor
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LiveClassesView({ classes }: { classes: LiveClassSession[] }) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Live Classes</h2>
        <p className="mt-1 text-sm text-slate-500">Join scheduled real-time lectures and track attendance.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {classes.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
            No live classes scheduled yet.
          </div>
        ) : (
          classes.map((c) => {
            const start = c.startTime ? new Date(c.startTime) : null;
            const now = new Date();
            const ms = start ? start.getTime() - now.getTime() : null;
            const mins = ms != null ? Math.max(0, Math.floor(ms / 60000)) : null;
            const hours = mins != null ? Math.floor(mins / 60) : null;
            const remaining = mins == null ? "TBA" : hours && hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;

            return (
              <div key={c.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0B3D91]">{c.courseCode}</p>
                    <h3 className="mt-1 truncate text-base font-semibold text-slate-900">{c.courseTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500">Lecturer: {c.lecturerName}</p>
                  </div>
                  <span className="rounded-full bg-[#FFC107]/15 px-3 py-1 text-xs font-bold text-[#0B3D91]">
                    Starts in {remaining}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-900">Start:</span>{" "}
                      {c.startTime ? new Date(c.startTime).toLocaleString() : "TBA"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">End:</span>{" "}
                      {c.endTime ? new Date(c.endTime).toLocaleString() : "TBA"}
                    </p>
                  </div>
                  <a
                    href={c.meetingLink ?? "#"}
                    target={c.meetingLink ? "_blank" : undefined}
                    rel={c.meetingLink ? "noreferrer" : undefined}
                    className={[
                      "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-colors",
                      c.meetingLink
                        ? "bg-[#0B3D91] text-white hover:bg-[#0B3D91]/90"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed",
                    ].join(" ")}
                    aria-disabled={!c.meetingLink}
                    onClick={(e) => {
                      if (!c.meetingLink) e.preventDefault();
                    }}
                  >
                    Join meeting
                  </a>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
                    <p className="text-xs font-semibold text-slate-500">Attendance</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Auto-tracked</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
                    <p className="text-xs font-semibold text-slate-500">Live chat</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">In session</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
                    <p className="text-xs font-semibold text-slate-500">Reminder</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Enabled</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function CoursePlaylistsView({
  videos,
  progressById,
  onSeedProgress,
  bookmarks,
  onBookmark,
}: {
  videos: VideoLesson[];
  progressById: Record<string, ProgressSnapshot>;
  onSeedProgress: (videoId: string, durationSeconds: number) => void;
  bookmarks: Record<string, true>;
  onBookmark: (id: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, VideoLesson[]>();
    for (const v of videos) {
      const key = `${v.courseCode}||${v.courseTitle}`;
      const list = map.get(key) ?? [];
      list.push(v);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, list]) => {
      const [courseCode, courseTitle] = key.split("||");
      const ordered = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { courseCode, courseTitle, videos: ordered };
    });
  }, [videos]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Course Playlists</h2>
        <p className="mt-1 text-sm text-slate-500">Switch between lessons, track progress, and continue watching.</p>
      </div>

      <div className="space-y-4">
        {grouped.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
            No course videos available yet.
          </div>
        ) : (
          grouped.map((g) => {
            const total = g.videos.length;
            const completed = g.videos.filter((v) => toPercent(progressById[v.id]) >= 95).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={g.courseCode} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0B3D91]">{g.courseCode}</p>
                    <h3 className="mt-1 truncate text-base font-semibold text-slate-900">{g.courseTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {completed}/{total} completed • {pct}% course progress
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200/70">
                  {g.videos.map((v, idx) => {
                    const snap = progressById[v.id];
                    const durationSeconds = snap?.durationSeconds ?? inferDurationSeconds(v.durationLabel);
                    if (!snap && durationSeconds > 0) onSeedProgress(v.id, durationSeconds);
                    const percent = toPercent(progressById[v.id]);
                    return (
                      <div key={v.id} className="flex items-center gap-3 bg-white px-4 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{v.title}</p>
                          <p className="text-xs text-slate-500">
                            {v.lecturerName} • {v.durationLabel ?? "—"} • Uploaded {formatDate(v.createdAt)}
                          </p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${percent >= 95 ? "bg-emerald-500" : "bg-[#FFC107]"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onBookmark(v.id)}
                            className={[
                              "rounded-xl px-3 py-2 text-xs font-bold ring-1 transition-colors",
                              bookmarks[v.id]
                                ? "bg-[#FFC107] text-[#0B3D91] ring-[#FFC107]"
                                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {bookmarks[v.id] ? "Bookmarked" : "Bookmark"}
                          </button>
                          <Link
                            href={`/student/video-lessons/watch/${v.id}`}
                            className="rounded-xl bg-[#0B3D91] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B3D91]/90"
                          >
                            {percent > 0 && percent < 95 ? "Continue" : "Watch"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function WatchHistoryView({ history, videos }: { history: HistoryEntry[]; videos: VideoLesson[] }) {
  const byId = useMemo(() => new Map(videos.map((v) => [v.id, v])), [videos]);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Watch History</h2>
        <p className="mt-1 text-sm text-slate-500">Monitor your study activity and reopen lessons quickly.</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No watch history yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.slice(0, 30).map((h, idx) => {
              const v = byId.get(h.videoId);
              const percent = h.durationSeconds > 0 ? Math.round((h.secondsWatched / h.durationSeconds) * 100) : 0;
              return (
                <div key={`${h.videoId}-${h.watchedAt}-${idx}`} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{v?.title ?? "Video"}</p>
                    <p className="text-xs text-slate-500">
                      {v ? `${v.courseCode} • ${v.lecturerName}` : "—"} • Watched {formatDate(h.watchedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-40">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${clamp(percent, 0, 100)}%` }} />
                      </div>
                      <p className="mt-1 text-right text-xs font-semibold text-slate-600">{clamp(percent, 0, 100)}%</p>
                    </div>
                    {v ? (
                      <Link
                        href={`/student/video-lessons/watch/${v.id}`}
                        className="rounded-xl bg-[#0B3D91] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B3D91]/90"
                      >
                        Reopen
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ProgressAnalyticsView({
  videos,
  progressById,
}: {
  videos: VideoLesson[];
  progressById: Record<string, ProgressSnapshot>;
}) {
  const byCourse = useMemo(() => {
    const map = new Map<string, { code: string; title: string; total: number; completed: number; avg: number }>();
    for (const v of videos) {
      const key = v.courseCode;
      const prev = map.get(key) ?? { code: v.courseCode, title: v.courseTitle, total: 0, completed: 0, avg: 0 };
      const pct = toPercent(progressById[v.id]);
      const nextTotal = prev.total + 1;
      const nextCompleted = prev.completed + (pct >= 95 ? 1 : 0);
      const nextAvg = Math.round((prev.avg * prev.total + pct) / nextTotal);
      map.set(key, { ...prev, total: nextTotal, completed: nextCompleted, avg: nextAvg });
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [videos, progressById]);

  const overall = useMemo(() => {
    const pcts = videos.map((v) => toPercent(progressById[v.id]));
    const avg = pcts.length ? Math.round(pcts.reduce((s, x) => s + x, 0) / pcts.length) : 0;
    const completed = pcts.filter((p) => p >= 95).length;
    return { avg, completed, total: pcts.length };
  }, [videos, progressById]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Video Progress</h2>
        <p className="mt-1 text-sm text-slate-500">Track completion, course progress, and learning percentage.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-semibold text-slate-700">Overall completion</p>
          <div className="mt-4 flex items-center gap-5">
            <CircularProgress percent={overall.avg} />
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{overall.avg}%</p>
              <p className="text-sm text-slate-500">
                {overall.completed}/{overall.total} lessons completed
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">Circular charts are UI analytics placeholders for now.</p>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-semibold text-slate-700">Course analytics</p>
          <div className="mt-4 space-y-3">
            {byCourse.length === 0 ? (
              <p className="text-sm text-slate-500">No course analytics yet.</p>
            ) : (
              byCourse.map((c) => {
                const pct = c.total ? Math.round((c.completed / c.total) * 100) : 0;
                return (
                  <div key={c.code} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0B3D91]">{c.code}</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{c.title}</p>
                        <p className="text-xs text-slate-500">
                          Avg watch: {c.avg}% • Completed: {c.completed}/{c.total}
                        </p>
                      </div>
                      <div className="w-full max-w-sm">
                        <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                          <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-right text-xs font-semibold text-slate-600">{pct}%</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CircularProgress({ percent }: { percent: number }) {
  const size = 86;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamp(percent, 0, 100) / 100) * c;

  return (
    <div className="relative h-[86px] w-[86px]">
      <svg width={size} height={size} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-slate-100" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-[#0B3D91]"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-sm font-extrabold text-slate-900">{clamp(percent, 0, 100)}%</span>
      </div>
    </div>
  );
}

function RecommendedView({
  videos,
  courses,
}: {
  videos: VideoLesson[];
  courses: { id: string; code: string; title: string }[];
}) {
  const picks = useMemo(() => {
    // placeholder heuristic: newest 6 videos, but bias to assigned courses list
    const assigned = new Set(courses.map((c) => c.code));
    const sorted = [...videos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const inCourses = sorted.filter((v) => assigned.has(v.courseCode));
    const out = sorted.filter((v) => !assigned.has(v.courseCode));
    return [...inCourses.slice(0, 6), ...out.slice(0, 2)].slice(0, 8);
  }, [videos, courses]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-bold text-slate-900">Recommended Videos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Recommendations are based on your courses and recent activity (UI logic placeholder).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {picks.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-3 rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200/80">
            No recommendations yet.
          </div>
        ) : (
          picks.map((v) => (
            <motion.div key={v.id} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
              <VideoCard
                video={v}
                progressPercent={0}
                uploadLabel={formatDate(v.createdAt)}
                isBookmarked={false}
                isDownloaded={false}
                onBookmark={() => {}}
                onDownload={() => {}}
                onPlay={() => {}}
                variant="recommend"
              />
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}

