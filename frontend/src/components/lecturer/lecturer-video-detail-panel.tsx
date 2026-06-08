"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import { LoadingState } from "@/components/ui/loading-indicator";
import { ContentEngagementPanel } from "@/components/content/content-engagement-panel";
import type { LecturerVideoRow } from "@/types/lecturer-content";

type Analytics = {
  video: {
    id: string;
    title: string;
    courseCode: string;
    courseTitle: string;
    videoUrl: string;
    duration: string | null;
  };
  stats: {
    enrolledCount: number;
    watcherCount: number;
    commentCount: number;
    likeCount: number;
    completionRate: number;
  };
  watchers: {
    studentId: string;
    fullName: string;
    email: string;
    percent: number;
    lastWatchedAt: string;
  }[];
  pinnedComment: {
    body: string;
    authorName: string;
    createdAt: string;
  } | null;
};

export function LecturerVideoDetailPanel({
  video,
  onClose,
}: {
  video: LecturerVideoRow;
  onClose: () => void;
}) {
  const { data, loading } = useApiLoad<Analytics>(`/api/lecturer/videos/${video.id}/analytics`, {
    errorTitle: "Could not load analytics",
  });

  return (
    <div className="space-y-5 rounded-2xl border-2 border-[#0B3D91]/20 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#0B3D91]">Video preview</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{video.title}</h3>
          <p className="text-sm text-slate-500">{video.course}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-black ring-1 ring-slate-200">
        <video
          src={video.videoUrl}
          controls
          className="aspect-video w-full"
          preload="metadata"
        />
      </div>

      {loading && !data ? (
        <LoadingState message="Loading engagement data…" layout="inline" />
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Enrolled", value: data.stats.enrolledCount },
              { label: "Watched", value: data.stats.watcherCount },
              { label: "Comments", value: data.stats.commentCount },
              { label: "Completed", value: `${data.stats.completionRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                <p className="text-xs font-semibold uppercase text-slate-500">{stat.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {data.pinnedComment ? (
            <div className="rounded-xl border border-[#0B3D91]/15 bg-[#0B3D91]/5 p-4">
              <p className="text-xs font-bold text-[#0B3D91]">Your pinned guidance</p>
              <p className="mt-2 text-sm text-slate-700">{data.pinnedComment.body}</p>
            </div>
          ) : null}

          <div className="rounded-xl ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">Student watch progress</p>
              <p className="text-xs text-slate-500">Based on synced viewing activity from enrolled students</p>
            </div>
            {data.watchers.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No watch data recorded yet.</p>
            ) : (
              <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto">
                {data.watchers.map((w) => (
                  <li key={w.studentId} className="flex items-center gap-4 px-4 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{w.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{w.email}</p>
                    </div>
                    <div className="w-28">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#FFC107]"
                          style={{ width: `${w.percent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs font-semibold text-[#0B3D91]">{w.percent}%</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-bold text-slate-900">Comments & engagement</p>
        <ContentEngagementPanel targetType="video" targetId={video.id} />
      </div>
    </div>
  );
}
