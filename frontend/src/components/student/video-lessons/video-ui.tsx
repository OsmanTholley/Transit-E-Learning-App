"use client";

import Image from "next/image";
import Link from "next/link";
import { VideoLesson } from "@/types/video-lessons";

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "L") + (parts[1]?.[0] ?? "");
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${percent >= 95 ? "bg-emerald-500" : "bg-red-600"}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function VideoCard({
  video,
  progressPercent,
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
    <article className="group overflow-hidden rounded-xl bg-white sm:rounded-2xl sm:shadow-sm sm:ring-1 sm:ring-slate-200/80">
      <Link href={`/student/video-lessons/watch/${video.id}`} onClick={onPlay} className="block">
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
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black" />
          )}
          {video.durationLabel ? (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {video.durationLabel}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex gap-2 p-2 sm:p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-xs font-extrabold text-white">
          {initials(video.lecturerName)}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/student/video-lessons/watch/${video.id}`} onClick={onPlay}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#0B3D91]">
              {video.title}
            </h3>
          </Link>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            {video.lecturerName} • {video.courseCode}
          </p>
          {variant !== "recommend" ? (
            <div className="mt-2 hidden sm:block">
              <ProgressBar percent={progressPercent} />
            </div>
          ) : (
            <p className="mt-2 hidden text-xs text-slate-500 sm:block">Recommended for you</p>
          )}
        </div>
      </div>

      <div className="hidden flex-wrap gap-2 px-4 pb-4 sm:flex">
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
          {isDownloaded ? "Downloaded" : "Download"}
        </button>

        <Link
          href={`/student/video-lessons/watch/${video.id}`}
          className="ml-auto inline-flex items-center justify-center rounded-xl bg-[#0B3D91] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B3D91]/90"
        >
          Open
        </Link>
      </div>
    </article>
  );
}
