"use client";

import { FormEvent, useState } from "react";
import { LoadingState } from "@/components/ui/loading-indicator";
import { useApiLoad } from "@/hooks/use-api-load";
import { requestApi } from "@/lib/fetch-api";

type Comment = {
  id: string;
  body: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
};

type Engagement = {
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
  pinnedComment: Comment | null;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: string) {
  if (role === "LECTURER") return "Lecturer";
  if (role === "ADMIN") return "Admin";
  return "Student";
}

export function VideoCommentsPanel({
  videoId,
  lecturerName,
}: {
  videoId: string;
  lecturerName: string;
}) {
  const url = `/api/content/video/${videoId}/social`;
  const { data, loading, setData } = useApiLoad<Engagement>(url, {
    silent: true,
    errorTitle: "Could not load comments",
  });
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const pinned = data?.pinnedComment ?? null;
  const thread = (data?.comments ?? []).filter((c) => c.id !== pinned?.id);

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    const result = await requestApi<Engagement>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", body: comment.trim() }),
      errorTitle: "Could not post comment",
    });
    if (result.ok) {
      setData(result.data);
      setComment("");
    }
    setPosting(false);
  }

  if (loading && !data) {
    return <LoadingState message="Loading discussion…" layout="inline" />;
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Comments & Discussions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ask questions, share insights, and read guidance from {lecturerName}.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {data?.comments.length ?? 0} comment{(data?.comments.length ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      {pinned ? (
        <div className="mt-5 rounded-2xl border border-[#0B3D91]/20 bg-gradient-to-br from-[#0B3D91]/8 to-[#0B3D91]/3 p-4 ring-1 ring-[#0B3D91]/10">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFC107] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B3D91]">
              Pinned lecturer comment
            </span>
            <span className="text-xs text-slate-500">{formatWhen(pinned.createdAt)}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-800">{pinned.body}</p>
          <p className="mt-2 text-xs font-semibold text-[#0B3D91]">— {pinned.authorName}</p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pinned lecturer comment</p>
          <p className="mt-2 text-sm text-slate-600">
            Your lecturer has not pinned guidance on this video yet. Check back after class updates.
          </p>
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Class discussion</p>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {thread.length === 0 ? (
            <li className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No student comments yet. Be the first to start the conversation.
            </li>
          ) : (
            thread.map((c) => (
              <li key={c.id} className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{c.authorName}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                    {roleLabel(c.authorRole)}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatWhen(c.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{c.body}</p>
              </li>
            ))
          )}
        </ul>
      </div>

      <form onSubmit={submitComment} className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Start a discussion</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a thoughtful question or comment for your classmates and lecturer…"
          rows={3}
          className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={posting || !comment.trim()}
            className="rounded-xl bg-[#0B3D91] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a3580] disabled:opacity-50"
          >
            {posting ? "Posting…" : "New comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
