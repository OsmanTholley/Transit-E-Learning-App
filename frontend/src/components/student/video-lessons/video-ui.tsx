"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { VideoLesson } from "@/types/video-lessons";

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "L") + (parts[1]?.[0] ?? "");
}

export function VideoCard({
  video,
  progressPercent,
  uploadLabel,
  isBookmarked,
  isDownloaded,
  onPlay,
  onBookmark,
  onDownload,
  variant = "default",
}: {
  video: VideoLesson;
  progressPercent: number;
  uploadLabel: string;
  isBookmarked: boolean;
  isDownloaded: boolean;
  onPlay: () => void;
  onBookmark: () => void;
  onDownload: () => void;
  variant?: "default" | "recommend";
}) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-slate-100">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B3D91] to-[#0B3D91]/70">
            <div className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
              {video.courseCode}
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center text-white">
                <p className="text-sm font-bold">{video.courseTitle}</p>
                <p className="mt-1 text-xs text-white/80">Educational video lesson</p>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {video.durationLabel ?? "—"}
            </span>
            <span className="inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              Uploaded {uploadLabel}
            </span>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={`/student/video-lessons/watch/${video.id}`}
              onClick={onPlay}
              className="inline-flex items-center gap-2 rounded-full bg-[#FFC107] px-3 py-2 text-xs font-extrabold text-[#0B3D91] shadow-sm transition-colors hover:bg-[#FFC107]/90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M8 5v14l11-7-11-7z" />
              </svg>
              Play
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B3D91]/10 text-sm font-extrabold text-[#0B3D91]">
            {initials(video.lecturerName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#0B3D91]">{video.courseCode}</p>
            <h3 className="mt-0.5 line-clamp-2 font-semibold text-slate-900">{video.title}</h3>
            <p className="mt-1 text-xs text-slate-500">Lecturer: {video.lecturerName}</p>
          </div>
        </div>

        {variant !== "recommend" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Progress</span>
              <span className="font-bold text-slate-700">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${progressPercent >= 95 ? "bg-emerald-500" : "bg-[#FFC107]"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
            <p className="text-xs font-semibold text-slate-500">Recommended for you</p>
            <p className="mt-1 text-xs text-slate-600">Based on your courses and learning path.</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onBookmark}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ring-1 transition-colors",
              isBookmarked
                ? "bg-[#FFC107] text-[#0B3D91] ring-[#FFC107]"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M6 2h12a2 2 0 0 1 2 2v20l-8-5-8 5V4a2 2 0 0 1 2-2z" />
            </svg>
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>

          <button
            type="button"
            onClick={onDownload}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ring-1 transition-colors",
              isDownloaded
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v10" />
              <path d="m7 11 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {isDownloaded ? "Downloaded" : "Download"}
          </button>

          <Link
            href={`/student/video-lessons/watch/${video.id}`}
            className="ml-auto inline-flex items-center justify-center rounded-xl bg-[#0B3D91] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B3D91]/90"
          >
            Open
          </Link>
        </div>
      </div>
    </article>
  );
}

