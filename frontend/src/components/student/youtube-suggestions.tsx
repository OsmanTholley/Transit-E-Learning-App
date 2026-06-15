"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleEffectWork } from "@/lib/react-effect-utils";

export type YTVideo = {
  videoId: string;
  title: string;
  description: string;
  channel: string;
  thumbnail: string;
  publishedAt: string;
};

type Props = {
  /** Full search query strings (e.g. "CSC101 Intro to Programming") */
  courseQueries: string[];
  /** Short labels shown on tab buttons (e.g. "CSC101") */
  courseLabels?: string[];
};

function trackView(video: YTVideo, query: string) {
  fetch("/api/student/youtube-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      videoId: video.videoId,
      title: video.title,
      channel: video.channel,
      thumbnail: video.thumbnail,
      query,
    }),
  }).catch(() => {});
}

function VideoCard({ video, onClick }: { video: YTVideo; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:ring-[#0B3D91]/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/50 text-left"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-xl ring-4 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-red-500">
            <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
          </svg>
          YouTube
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p
          className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#0B3D91]"
          dangerouslySetInnerHTML={{ __html: video.title }}
        />
        <p className="mt-0.5 text-xs text-slate-500 truncate">{video.channel}</p>
      </div>
    </button>
  );
}

export function YouTubeSuggestions({ courseQueries, courseLabels }: Props) {
  const router = useRouter();
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState(0);
  const [activeTab, setActiveTab] = useState<"suggestions" | "search">("suggestions");
  const [searchInput, setSearchInput] = useState("");
  const [customSearchQuery, setCustomSearchQuery] = useState("");

  const queries = courseQueries.filter(Boolean).slice(0, 5);
  const labels = courseLabels ?? queries;

  const currentQuery = activeTab === "search" ? customSearchQuery : (queries[activeQuery] ?? queries[0] ?? "");

  useEffect(() => {
    const q = currentQuery;
    scheduleEffectWork(() => {
      if (!q) {
        setVideos([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setVideos([]);
      setFetchError(null);
    });

    if (!q) return;

    fetch(`/api/student/youtube-suggestions?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.unavailable) {
          setUnavailable(true);
        } else {
          setVideos(data.videos ?? []);
          setUnavailable(false);
          if (data.error) setFetchError(data.error);
        }
      })
      .catch(() => setFetchError("Could not reach YouTube suggestions."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeQuery, customSearchQuery, queries.join("|")]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (query) {
      setCustomSearchQuery(query);
      setActiveTab("search");
    }
  };

  const handleClearSearch = () => {
    setCustomSearchQuery("");
    setSearchInput("");
    setActiveTab("suggestions");
  };

  if (unavailable) return null;

  return (
    <section className="space-y-4 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200/50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 shadow-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Explore YouTube Lessons</h2>
          </div>
          <p className="text-xs text-slate-500">
            Find supplementary tutorials and lectures directly inside your learning hub
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex w-full items-center gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search YouTube tutorials..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-medium shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0B3D91]/30 focus:ring-4 focus:ring-[#0B3D91]/5"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                title="Clear search"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-[#0B3D91] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#0B3D91]/90 transition"
          >
            Search
          </button>
        </form>
      </div>

      {queries.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Suggestions:
            </span>

            {queries.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setActiveQuery(i);
                  setActiveTab("suggestions");
                }}
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  activeTab === "suggestions" && activeQuery === i
                    ? "bg-[#0B3D91] text-white shadow-md shadow-[#0B3D91]/20"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
                ].join(" ")}
              >
                {labels[i] ?? q}
              </button>
            ))}

            {customSearchQuery && (
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition",
                  activeTab === "search"
                    ? "bg-red-600 text-white shadow-md shadow-red-900/30"
                    : "bg-red-50 text-red-700 hover:bg-red-100/80 ring-1 ring-red-200/50",
                ].join(" ")}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                YouTube: &quot;{customSearchQuery}&quot;
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSearch();
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-black/10 text-current transition"
                  title="Clear search"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          {activeTab === "search" ? (
            <p className="text-[11px] font-medium text-slate-500">
              Showing custom search results from YouTube
            </p>
          ) : (
            <p className="text-[11px] font-medium text-slate-500">
              Showing course recommendations for{" "}
              <span className="font-bold text-[#0B3D91]">{labels[activeQuery] ?? "your program"}</span>
            </p>
          )}
        </div>
      )}

      {fetchError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-800">
          {fetchError}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/40">
              <div className="aspect-video w-full rounded-xl bg-slate-100" />
              <div className="space-y-2.5 p-3">
                <div className="h-3 rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : !currentQuery ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
          <p className="text-xs font-semibold text-slate-500">
            Search for a topic above to discover YouTube tutorials.
          </p>
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m15 15 6 6m-6-6A7.5 7.5 0 1 0 4.5 4.5a7.5 7.5 0 0 0 10.5 10.5z" />
          </svg>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {activeTab === "search"
              ? "No matching YouTube videos found. Try a different search."
              : "No suggestions found for this course. Try another tab or use the search bar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {videos.map((v) => (
            <VideoCard
              key={v.videoId}
              video={v}
              onClick={() => {
                trackView(v, currentQuery);
                router.push(`/student/video-lessons/watch/${v.videoId}`);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
