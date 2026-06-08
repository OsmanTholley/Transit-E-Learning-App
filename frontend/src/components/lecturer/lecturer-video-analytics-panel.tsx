"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import { LoadingState } from "@/components/ui/loading-indicator";
import { ContentEngagementPanel } from "@/components/content/content-engagement-panel";
import { YoutubeStyleVideoPlayer } from "@/components/video/youtube-style-video-player";
import type { VideoPlayState } from "@/components/video/youtube-style-video-player";
import type { LecturerVideoRow } from "@/types/lecturer-content";

type Analytics = {
  stats: {
    enrolledCount: number;
    watcherCount: number;
    commentCount: number;
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

export function LecturerVideoAnalyticsPanel({
  video,
  showPlayer = true,
  onPlayStateChange,
}: {
  video: LecturerVideoRow;
  showPlayer?: boolean;
  onPlayStateChange?: (state: VideoPlayState) => void;
}) {
  const { data, loading } = useApiLoad<Analytics>(`/api/lecturer/videos/${video.id}/analytics`, {
    errorTitle: "Could not load analytics",
  });

  return (
    <div className="space-y-5">
      {showPlayer ? (
        <>
          <div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{video.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{video.course}</p>
          </div>
          <YoutubeStyleVideoPlayer
            src={video.videoUrl}
            title={video.title}
            onPlayStateChange={onPlayStateChange}
            className="w-full"
          />
        </>
      ) : null}

      {loading && !data ? (
        <LoadingState message="Loading engagement data…" layout="inline" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Enrolled", value: data.stats.enrolledCount },
              { label: "Watched", value: data.stats.watcherCount },
              { label: "Comments", value: data.stats.commentCount },
              { label: "Completed", value: `${data.stats.completionRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-slate-100 sm:px-4">
                <p className="text-[10px] font-semibold uppercase text-slate-500 sm:text-xs">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{stat.value}</p>
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
