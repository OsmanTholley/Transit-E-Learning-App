"use client";
import { LoadingState } from "@/components/ui/loading-indicator";
import { useCallback, useEffect, useState } from "react";

type ViewLog = {
  id: string;
  videoId: string;
  title: string;
  channel: string | null;
  thumbnail: string | null;
  youtubeUrl: string | null;
  query: string | null;
  studentName: string;
  studentId: string | null;
  studentEmail: string | null;
  viewedAt: string;
};

type TopVideo = {
  videoId: string;
  title: string;
  channel: string | null;
  thumbnail: string | null;
  youtubeUrl: string | null;
  count: number;
};

function EmbedModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-[#0B1220] overflow-hidden ring-1 ring-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <p className="line-clamp-1 text-sm font-semibold text-white" dangerouslySetInnerHTML={{ __html: title }} />
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="px-5 py-3 border-t border-white/10">
          <p className="text-xs text-slate-400">Admin preview — content from YouTube</p>
        </div>
      </div>
    </div>
  );
}

export function AdminYouTubeViewsPage() {
  const [logs, setLogs] = useState<ViewLog[]>([]);
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewVideo, setPreviewVideo] = useState<{ id: string; title: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/youtube-views", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs ?? []);
        setTopVideos(data.topVideos ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.title.toLowerCase().includes(q) ||
      (log.channel ?? "").toLowerCase().includes(q) ||
      log.studentName.toLowerCase().includes(q) ||
      (log.studentEmail ?? "").toLowerCase().includes(q) ||
      (log.query ?? "").toLowerCase().includes(q)
    );
  });

  const uniqueStudents = new Set(logs.map((l) => l.studentName)).size;
  const uniqueVideos = new Set(logs.map((l) => l.videoId)).size;

  return (
    <>
      {previewVideo && (
        <EmbedModal
          videoId={previewVideo.id}
          title={previewVideo.title}
          onClose={() => setPreviewVideo(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">YouTube</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Student YouTube Views</h1>
            <p className="mt-1 text-sm text-slate-500">
              All YouTube videos watched by students inside the portal — live tracking via activity logs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <article className="portal-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Views</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{total}</p>
            <p className="mt-0.5 text-xs text-slate-400">YouTube video opens tracked</p>
          </article>
          <article className="portal-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unique Videos</p>
            <p className="mt-1 text-3xl font-bold text-red-600">{uniqueVideos}</p>
            <p className="mt-0.5 text-xs text-slate-400">Distinct YouTube videos watched</p>
          </article>
          <article className="portal-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Students</p>
            <p className="mt-1 text-3xl font-bold text-[#0B3D91]">{uniqueStudents}</p>
            <p className="mt-0.5 text-xs text-slate-400">Students who opened YouTube videos</p>
          </article>
        </section>

        {/* Top Videos */}
        {topVideos.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">🔥 Most Watched YouTube Videos</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {topVideos.slice(0, 10).map((v) => (
                <button
                  key={v.videoId}
                  type="button"
                  onClick={() => setPreviewVideo({ id: v.videoId, title: v.title })}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 text-left transition hover:ring-red-400 hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    {v.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800">
                        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-red-500 opacity-60">
                          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                        </svg>
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-lg">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    {/* View count badge */}
                    <span className="absolute right-2 top-2 rounded-full bg-[#0B3D91] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      {v.count} view{v.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 group-hover:text-[#0B3D91]" dangerouslySetInnerHTML={{ __html: v.title }} />
                    {v.channel && <p className="mt-0.5 text-[10px] text-slate-400 truncate">{v.channel}</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All views table */}
        <section className="portal-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              All View Logs
              {filtered.length !== logs.length && (
                <span className="ml-2 text-xs font-normal text-slate-400">({filtered.length} of {logs.length})</span>
              )}
            </h2>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search by video, student, course…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10 sm:w-72"
              />
            </div>
          </div>

          {loading && logs.length === 0 ? (
            <LoadingState message="Loading YouTube view logs…" layout="compact" className="p-5" />
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 fill-red-100 stroke-red-300" fill="none" strokeWidth="1.5">
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-600">
                {logs.length === 0
                  ? "No YouTube views recorded yet. Students will appear here once they open videos."
                  : "No results match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Video</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Course Query</th>
                    <th className="px-4 py-3">Viewed At</th>
                    <th className="px-4 py-3">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((log) => (
                    <tr key={log.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {log.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={log.thumbnail}
                              alt=""
                              className="h-12 w-20 shrink-0 rounded-lg object-cover bg-slate-100"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-red-400">
                                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.81z" />
                              </svg>
                            </div>
                          )}
                          <p
                            className="line-clamp-2 max-w-xs text-xs font-semibold text-slate-900"
                            dangerouslySetInnerHTML={{ __html: log.title }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{log.channel ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{log.studentName}</p>
                        {log.studentId && <p className="text-xs text-slate-400">{log.studentId}</p>}
                        {log.studentEmail && <p className="text-xs text-slate-400">{log.studentEmail}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{log.query ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {new Date(log.viewedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setPreviewVideo({ id: log.videoId, title: log.title })}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Watch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
