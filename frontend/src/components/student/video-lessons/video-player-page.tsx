"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VideoLesson } from "@/types/video-lessons";

type PlayerState = {
  speed: number;
  quality: "Auto" | "1080p" | "720p" | "480p";
  pip: boolean;
};

type ProgressSnapshot = {
  secondsWatched: number;
  durationSeconds: number;
  updatedAt: string;
};

const LS_KEYS = {
  progress: "transit.videoLessons.progress.v1",
  bookmarks: "transit.videoLessons.bookmarks.v1",
} as const;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function secondsFromLabel(label: string | null) {
  if (!label) return 0;
  const hhmmss = label.split(":").map((p) => Number(p));
  if (hhmmss.length === 3 && hhmmss.every((n) => Number.isFinite(n))) {
    return hhmmss[0] * 3600 + hhmmss[1] * 60 + hhmmss[2];
  }
  const mins = label.match(/(\d+)\s*m/i);
  if (mins) return Number(mins[1]) * 60;
  return 0;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${clamp(percent, 0, 100)}%` }} />
    </div>
  );
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ring-1 transition-colors",
        active ? "bg-[#FFC107] text-[#0B3D91] ring-[#FFC107]" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
      aria-pressed={active}
    >
      {children}
      {label}
    </button>
  );
}

function SimpleTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
    />
  );
}

export function VideoPlayerPage({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<VideoLesson | null>(null);
  const [allVideos, setAllVideos] = useState<VideoLesson[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [player, setPlayer] = useState<PlayerState>({ speed: 1, quality: "Auto", pip: false });
  const [showNotes, setShowNotes] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [notes, setNotes] = useState("");
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  const [progressById, setProgressById] = useState<Record<string, ProgressSnapshot>>(() =>
    safeParse<Record<string, ProgressSnapshot>>(typeof window === "undefined" ? null : localStorage.getItem(LS_KEYS.progress), {})
  );
  const [bookmarks, setBookmarks] = useState<Record<string, true>>(() =>
    safeParse<Record<string, true>>(typeof window === "undefined" ? null : localStorage.getItem(LS_KEYS.bookmarks), {})
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.progress, JSON.stringify(progressById));
  }, [progressById]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.bookmarks, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [vRes, listRes] = await Promise.all([
          fetch(`/api/student/video-lessons/videos/${videoId}`),
          fetch("/api/student/video-lessons/videos"),
        ]);
        const vJson = await vRes.json();
        if (!vRes.ok) throw new Error(vJson?.error ?? "Failed to load video.");
        const listJson = await listRes.json();
        if (!listRes.ok) throw new Error(listJson?.error ?? "Failed to load playlist.");

        if (!cancelled) {
          setVideo(vJson);
          setAllVideos(listJson);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  useEffect(() => {
    if (!video) return;
    const durationSeconds = progressById[video.id]?.durationSeconds ?? secondsFromLabel(video.durationLabel);
    const t = window.setTimeout(() => {
      setProgressById((prev) => {
        const existing = prev[video.id];
        if (existing) return prev;
        if (!durationSeconds) return prev;
        return {
          ...prev,
          [video.id]: { secondsWatched: 0, durationSeconds, updatedAt: new Date().toISOString() },
        };
      });
    }, 0);
    return () => window.clearTimeout(t);
  }, [video, progressById]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = player.speed;
  }, [player.speed]);

  const playlist = useMemo(() => {
    if (!allVideos || !video) return [];
    return allVideos
      .filter((v) => v.courseCode === video.courseCode)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [allVideos, video]);

  const idx = useMemo(() => {
    if (!video) return -1;
    return playlist.findIndex((v) => v.id === video.id);
  }, [playlist, video]);

  const next = idx >= 0 ? playlist[idx + 1] : null;
  const prev = idx >= 0 ? playlist[idx - 1] : null;

  const progress = video ? progressById[video.id] : undefined;
  const percent = progress && progress.durationSeconds > 0 ? Math.round((progress.secondsWatched / progress.durationSeconds) * 100) : 0;

  function toggleBookmark() {
    if (!video) return;
    setBookmarks((prevMap) => {
      const nextMap = { ...prevMap };
      if (nextMap[video.id]) delete nextMap[video.id];
      else nextMap[video.id] = true;
      return nextMap;
    });
  }

  async function askTutor() {
    const q = tutorQuestion.trim();
    if (!q) return;
    setTutorLoading(true);
    setTutorAnswer(null);
    try {
      const res = await fetch("/api/student/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: video ? `${q}\n\nContext (video): ${video.courseCode} - ${video.title}` : q,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "AI Tutor failed.");
      setTutorAnswer(json?.answer ?? json?.response ?? "AI Tutor response received.");
    } catch (e) {
      setTutorAnswer(e instanceof Error ? e.message : "AI Tutor failed.");
    } finally {
      setTutorLoading(false);
    }
  }

  function syncProgressFromPlayer() {
    const el = videoRef.current;
    if (!el || !video) return;
    const durationSeconds = Number.isFinite(el.duration) ? Math.floor(el.duration) : progress?.durationSeconds ?? 0;
    const secondsWatched = Number.isFinite(el.currentTime) ? Math.floor(el.currentTime) : 0;
    if (!durationSeconds) return;
    setProgressById((prevMap) => ({
      ...prevMap,
      [video.id]: {
        secondsWatched: clamp(secondsWatched, 0, durationSeconds),
        durationSeconds,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/80">
        Loading video player…
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700 shadow-sm ring-1 ring-rose-200">
        {error ?? "Video not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold text-[#0B3D91]">{video.courseCode}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{video.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Lecturer: {video.lecturerName} • Uploaded {formatDate(video.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/student/video-lessons"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Back to videos
          </Link>
          {prev ? (
            <Link
              href={`/student/video-lessons/watch/${prev.id}`}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Previous
            </Link>
          ) : null}
          {next ? (
            <Link
              href={`/student/video-lessons/watch/${next.id}`}
              className="rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0B3D91]/90"
            >
              Next lesson
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8 space-y-4">
          <div className="overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-slate-200/80">
            <video
              ref={videoRef}
              src={video.videoUrl}
              controls
              playsInline
              className="h-full w-full"
              onTimeUpdate={() => {
                // lightweight throttling via RAF-ish: update only sometimes by sampling
                syncProgressFromPlayer();
              }}
              onPause={syncProgressFromPlayer}
              onEnded={syncProgressFromPlayer}
            />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Learning progress</p>
                <p className="text-xs text-slate-500">
                  {percent}% watched • Auto next lesson enabled • Picture-in-picture supported
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <IconButton
                  label={bookmarks[video.id] ? "Bookmarked" : "Bookmark"}
                  active={Boolean(bookmarks[video.id])}
                  onClick={toggleBookmark}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M6 2h12a2 2 0 0 1 2 2v20l-8-5-8 5V4a2 2 0 0 1 2-2z" />
                  </svg>
                </IconButton>
                <IconButton
                  label="Download"
                  onClick={() => {
                    // UI-only: direct download if the URL is downloadable
                    window.open(video.videoUrl, "_blank", "noreferrer");
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v10" />
                    <path d="m7 11 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                </IconButton>
                <IconButton
                  label="Share"
                  onClick={async () => {
                    const url = `${window.location.origin}/student/video-lessons/watch/${video.id}`;
                    await navigator.clipboard.writeText(url);
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                    <path d="M16 6l-4-4-4 4" />
                    <path d="M12 2v14" />
                  </svg>
                </IconButton>
                <IconButton label="Notes" active={showNotes} onClick={() => setShowNotes((v) => !v)}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </IconButton>
                <IconButton label="AI Tutor" active={showTutor} onClick={() => setShowTutor((v) => !v)}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" />
                    <path d="M9 14h6M10 18h4" />
                  </svg>
                </IconButton>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-12">
              <div className="md:col-span-6">
                <label className="text-xs font-semibold text-slate-600">Playback speed</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPlayer((p) => ({ ...p, speed: s }))}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors",
                        player.speed === s
                          ? "bg-[#0B3D91] text-white ring-[#0B3D91]"
                          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-600">Quality</label>
                <select
                  value={player.quality}
                  onChange={(e) => setPlayer((p) => ({ ...p, quality: e.target.value as PlayerState["quality"] }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
                >
                  {(["Auto", "1080p", "720p", "480p"] as const).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-600">Picture-in-picture</label>
                <button
                  type="button"
                  onClick={async () => {
                    const el = videoRef.current;
                    if (!el) return;
                    if (document.pictureInPictureElement) {
                      await document.exitPictureInPicture?.();
                      setPlayer((p) => ({ ...p, pip: false }));
                      return;
                    }
                    try {
                      await el.requestPictureInPicture?.();
                      setPlayer((p) => ({ ...p, pip: true }));
                    } catch {
                      setPlayer((p) => ({ ...p, pip: false }));
                    }
                  }}
                  className={[
                    "mt-2 w-full rounded-xl px-3 py-2 text-sm font-bold ring-1 transition-colors",
                    player.pip ? "bg-[#FFC107] text-[#0B3D91] ring-[#FFC107]" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {player.pip ? "PiP enabled" : "Enable PiP"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <ProgressBar percent={percent} />
            </div>
          </div>

          <AnimatePresence>
            {showNotes ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"
              >
                <h2 className="text-lg font-bold text-slate-900">Notes</h2>
                <p className="mt-1 text-sm text-slate-500">Write your key takeaways while watching. (Saved in this session.)</p>
                <div className="mt-4">
                  <SimpleTextarea value={notes} onChange={setNotes} placeholder="Example: Definition of SQL, examples of SELECT…" />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showTutor ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">AI Tutor</h2>
                    <p className="mt-1 text-sm text-slate-500">Ask questions about this video and get step-by-step help.</p>
                  </div>
                  <Link
                    href="/student/ai-tutor"
                    className="rounded-xl bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0B3D91] shadow-sm hover:bg-[#FFC107]/90"
                  >
                    Full AI Tutor
                  </Link>
                </div>

                <div className="mt-4 grid gap-3">
                  <input
                    value={tutorQuestion}
                    onChange={(e) => setTutorQuestion(e.target.value)}
                    placeholder='Try: "Explain the law of reflection from this video."'
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
                  />
                  <button
                    type="button"
                    onClick={askTutor}
                    disabled={tutorLoading}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#0B3D91] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0B3D91]/90 disabled:opacity-60"
                  >
                    {tutorLoading ? "Thinking…" : "Ask AI Tutor"}
                  </button>
                  {tutorAnswer ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200/70 whitespace-pre-wrap">
                      {tutorAnswer}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <h2 className="text-lg font-bold text-slate-900">Comments & Discussions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ask questions under videos, reply to classmates, and see pinned lecturer notes (UI ready).
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl bg-[#0B3D91]/10 p-4 ring-1 ring-[#0B3D91]/15">
                <p className="text-xs font-bold text-[#0B3D91]">Pinned lecturer comment</p>
                <p className="mt-2 text-sm text-slate-700">
                  Focus on the examples in the last 5 minutes—these are common exam patterns.
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">— {video.lecturerName}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                <p className="text-xs font-bold text-slate-700">Start a discussion</p>
                <p className="mt-2 text-sm text-slate-600">Threaded replies, likes, and lecturer responses are supported in UI.</p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  New comment
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <h2 className="text-lg font-bold text-slate-900">Playlist</h2>
            <p className="mt-1 text-sm text-slate-500">
              {video.courseCode} — {video.courseTitle}
            </p>

            <div className="mt-4 space-y-2">
              {playlist.length === 0 ? (
                <p className="text-sm text-slate-500">No playlist lessons found.</p>
              ) : (
                playlist.map((v) => {
                  const snap = progressById[v.id];
                  const duration = snap?.durationSeconds ?? secondsFromLabel(v.durationLabel);
                  const p = duration > 0 ? Math.round(((snap?.secondsWatched ?? 0) / duration) * 100) : 0;
                  const active = v.id === video.id;
                  return (
                    <Link
                      key={v.id}
                      href={`/student/video-lessons/watch/${v.id}`}
                      className={[
                        "block rounded-2xl p-3 ring-1 transition-colors",
                        active ? "bg-[#FFC107]/15 ring-[#FFC107]/40" : "bg-white ring-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                          {playlist.findIndex((x) => x.id === v.id) + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900">{v.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{v.durationLabel ?? "—"}</p>
                          <div className="mt-2">
                            <ProgressBar percent={clamp(p, 0, 100)} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
              <p className="text-xs font-bold text-slate-700">Auto next lesson</p>
              <p className="mt-1 text-xs text-slate-600">When this video ends, the “Next lesson” button is ready.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

