"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useStudentPreference } from "@/hooks/use-student-preference";
import { STUDENT_PREF_KEYS } from "@/lib/student-preference-keys";
import { LoadingState } from "@/components/ui/loading-indicator";
import { VideoCommentsPanel } from "@/components/student/video-lessons/video-comments-panel";
import { YoutubeStyleVideoPlayer } from "@/components/video/youtube-style-video-player";
import type { VideoPlayState } from "@/components/video/youtube-style-video-player";
import { VideoLesson } from "@/types/video-lessons";

type ProgressSnapshot = {
  secondsWatched: number;
  durationSeconds: number;
  updatedAt: string;
};

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
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-red-600" style={{ width: `${clamp(percent, 0, 100)}%` }} />
    </div>
  );
}

export function VideoPlayerPage({ videoId }: { videoId: string }) {
  const [video, setVideo] = useState<VideoLesson | null>(null);
  const [allVideos, setAllVideos] = useState<VideoLesson[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playState, setPlayState] = useState<VideoPlayState>("paused");
  const [showNotes, setShowNotes] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [notes, setNotes] = useState("");
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  const [progressById, setProgressById] = useStudentPreference<Record<string, ProgressSnapshot>>(
    STUDENT_PREF_KEYS.videoProgress,
    {}
  );
  const [bookmarks, setBookmarks] = useStudentPreference<Record<string, true>>(
    STUDENT_PREF_KEYS.videoBookmarks,
    {}
  );

  const lastSyncRef = useRef(0);

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
  }, [video, progressById, setProgressById]);

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
  const percent =
    progress && progress.durationSeconds > 0
      ? Math.round((progress.secondsWatched / progress.durationSeconds) * 100)
      : 0;

  function syncProgress(currentTime: number, duration: number) {
    if (!video || !duration) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 800) return;
    lastSyncRef.current = now;
    setProgressById((prevMap) => ({
      ...prevMap,
      [video.id]: {
        secondsWatched: clamp(Math.floor(currentTime), 0, Math.floor(duration)),
        durationSeconds: Math.floor(duration),
        updatedAt: new Date().toISOString(),
      },
    }));
  }

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

  if (loading) {
    return <LoadingState message="Loading video player…" panel minHeight={160} />;
  }

  if (error || !video) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700 shadow-sm ring-1 ring-rose-200">
        {error ?? "Video not found."}
      </div>
    );
  }

  const hidePlaylist = playState === "playing";

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <section className="lg:col-span-8 space-y-3">
          <YoutubeStyleVideoPlayer
            key={video.id}
            src={video.videoUrl}
            title={video.title}
            poster={video.thumbnailUrl ?? undefined}
            onPlayStateChange={setPlayState}
            onTimeUpdate={syncProgress}
            className="w-full"
          />

          <div className="space-y-2 px-0.5">
            <h1 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">{video.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{video.lecturerName}</span>
              <span className="text-slate-300">•</span>
              <span>{video.courseCode}</span>
              <span className="text-slate-300">•</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/80">
            <button
              type="button"
              onClick={toggleBookmark}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold ring-1",
                bookmarks[video.id]
                  ? "bg-[#0B3D91] text-white ring-[#0B3D91]"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100",
              ].join(" ")}
            >
              {bookmarks[video.id] ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => window.open(video.videoUrl, "_blank", "noreferrer")}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              Download
            </button>
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/student/video-lessons/watch/${video.id}`;
                await navigator.clipboard.writeText(url);
              }}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold ring-1",
                showNotes ? "bg-[#0B3D91] text-white ring-[#0B3D91]" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100",
              ].join(" ")}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => setShowTutor((v) => !v)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold ring-1",
                showTutor ? "bg-[#0B3D91] text-white ring-[#0B3D91]" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100",
              ].join(" ")}
            >
              AI Tutor
            </button>
            {prev ? (
              <Link
                href={`/student/video-lessons/watch/${prev.id}`}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              >
                Previous
              </Link>
            ) : null}
            {next ? (
              <Link
                href={`/student/video-lessons/watch/${next.id}`}
                className="rounded-full bg-[#0B3D91] px-3 py-1.5 text-xs font-bold text-white ring-1 ring-[#0B3D91] hover:bg-[#0a3580]"
              >
                Next
              </Link>
            ) : null}
          </div>

          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Progress</span>
              <span className="font-bold text-slate-700">{percent}%</span>
            </div>
            <div className="mt-2">
              <ProgressBar percent={percent} />
            </div>
          </div>

          <AnimatePresence>
            {showNotes ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80"
              >
                <h2 className="text-base font-bold text-slate-900">Notes</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write key takeaways while watching…"
                  className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {showTutor ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900">AI Tutor</h2>
                  <Link href="/student/ai-tutor" className="text-xs font-bold text-[#0B3D91] hover:underline">
                    Open full tutor
                  </Link>
                </div>
                <input
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder='Ask about this video…'
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
                />
                <button
                  type="button"
                  onClick={askTutor}
                  disabled={tutorLoading}
                  className="mt-2 rounded-xl bg-[#0B3D91] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {tutorLoading ? "Thinking…" : "Ask"}
                </button>
                {tutorAnswer ? (
                  <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    {tutorAnswer}
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!hidePlaylist ? <VideoCommentsPanel videoId={video.id} lecturerName={video.lecturerName} /> : null}
        </section>

        {!hidePlaylist ? (
          <aside className="lg:col-span-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Up next</h2>
                <Link href="/student/video-lessons" className="text-xs font-semibold text-[#0B3D91] hover:underline">
                  All videos
                </Link>
              </div>
              <div className="space-y-2">
                {playlist.map((v) => {
                  const snap = progressById[v.id];
                  const duration = snap?.durationSeconds ?? secondsFromLabel(v.durationLabel);
                  const p = duration > 0 ? Math.round(((snap?.secondsWatched ?? 0) / duration) * 100) : 0;
                  const active = v.id === video.id;
                  return (
                    <Link
                      key={v.id}
                      href={`/student/video-lessons/watch/${v.id}`}
                      className={[
                        "flex gap-2 rounded-lg p-1.5 transition hover:bg-slate-100",
                        active ? "bg-slate-100" : "",
                      ].join(" ")}
                    >
                      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-black" />
                        {v.durationLabel ? (
                          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] font-bold text-white">
                            {v.durationLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{v.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{v.lecturerName}</p>
                        <div className="mt-2">
                          <ProgressBar percent={p} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
