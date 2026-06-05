"use client";

import { FormEvent, useEffect, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import type { SocialTargetSlug } from "@/lib/content-social";

type Engagement = {
  likeCount: number;
  likedByMe: boolean;
  comments: {
    id: string;
    body: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  }[];
};

export function ContentEngagementPanel({
  targetType,
  targetId,
  compact,
  onDelete,
  canDelete,
}: {
  targetType: SocialTargetSlug;
  targetId: string;
  compact?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const [data, setData] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const url = `/api/content/${targetType}/${targetId}/social`;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const result = await requestApi<Engagement>(url, {
        silent: true,
        errorTitle: "Could not load comments",
      });
      if (active && result.ok) setData(result.data);
      if (active) setLoading(false);
    }
    Promise.resolve().then(() => {
      void load();
    });
    return () => {
      active = false;
    };
  }, [url]);

  async function toggleLike() {
    const result = await requestApi<Engagement>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like" }),
      errorTitle: "Could not update like",
    });
    if (result.ok) setData(result.data);
  }

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

  async function handleDelete() {
    const { showConfirm } = await import("@/lib/swal");
    const ok = await showConfirm("Delete this item?", "Comments and likes will be removed.");
    if (!ok) return;
    const result = await requestApi(`/api/admin/content/${targetType}/${targetId}`, {
      method: "DELETE",
      errorTitle: "Could not delete",
    });
    if (result.ok) {
      const { showSuccess } = await import("@/lib/swal");
      await showSuccess("Deleted", "Content removed.");
      onDelete?.();
    }
  }

  if (loading && !data) {
    return <p className="text-xs text-slate-500">Loading comments…</p>;
  }

  return (
    <div className={compact ? "mt-3 space-y-2" : "mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3"}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void toggleLike()}
          className={[
            "rounded-lg px-3 py-1.5 text-xs font-semibold",
            data?.likedByMe ? "bg-rose-100 text-rose-700" : "bg-white text-slate-700 ring-1 ring-slate-200",
          ].join(" ")}
        >
          {data?.likedByMe ? "♥ Liked" : "♡ Like"} ({data?.likeCount ?? 0})
        </button>
        <span className="text-xs text-slate-500">{data?.comments.length ?? 0} comment(s)</span>
        {canDelete ? (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="ml-auto text-xs font-semibold text-rose-600"
          >
            Delete
          </button>
        ) : null}
      </div>

      <ul className="max-h-40 space-y-2 overflow-y-auto">
        {(data?.comments ?? []).length === 0 ? (
          <li className="text-xs text-slate-500">No comments yet.</li>
        ) : (
          data?.comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-white px-2 py-1.5 text-xs ring-1 ring-slate-100">
              <p className="font-semibold text-slate-800">
                {c.authorName}{" "}
                <span className="font-normal text-slate-400">({c.authorRole.toLowerCase()})</span>
              </p>
              <p className="mt-0.5 text-slate-600">{c.body}</p>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={submitComment} className="flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
        />
        <button
          type="submit"
          disabled={posting || !comment.trim()}
          className="rounded-lg bg-[#0B3D91] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
