"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LS_LIKES, LS_SAVED, questionStatusLabel, questionStatusStyles } from "@/components/student/discussions/discussion-ui";
import type { DiscussionComment, DiscussionDetail } from "@/types/student-discussions";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CommentItem({ comment }: { comment: DiscussionComment }) {
  const roleBadge =
    comment.authorRole === "lecturer"
      ? "bg-[#FFC107] text-[#0B3D91]"
      : comment.authorRole === "admin"
        ? "bg-slate-800 text-white"
        : "bg-slate-100 text-slate-600";

  return (
    <div
      className={[
        "rounded-2xl p-4 ring-1",
        comment.isPinned ? "bg-[#0B3D91]/5 ring-[#0B3D91]/20" : "bg-slate-50 ring-slate-200/70",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3D91]/10 text-xs font-bold text-[#0B3D91]">
          {comment.authorInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{comment.authorName}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${roleBadge}`}>
              {comment.authorRole}
            </span>
            {comment.isPinned ? (
              <span className="text-[10px] font-bold text-[#0B3D91]">Pinned</span>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.comment}</p>
          <p className="mt-2 text-xs text-slate-400">{formatRelative(comment.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

export function DiscussionThreadPage({ discussionId }: { discussionId: string }) {
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [likes, setLikes] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/discussions/${discussionId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load");
        if (!cancelled) {
          setDiscussion(json);
          const likeMap = safeParse<Record<string, number>>(localStorage.getItem(LS_LIKES), {});
          setLikes(likeMap[discussionId] ?? 0);
          const savedMap = safeParse<Record<string, true>>(localStorage.getItem(LS_SAVED), {});
          setSaved(Boolean(savedMap[discussionId]));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [discussionId]);

  async function postReply() {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/student/discussions/${discussionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: reply }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to post");
      setDiscussion((prev) =>
        prev ? { ...prev, comments: [...prev.comments, json], replyCount: prev.replyCount + 1 } : prev
      );
      setReply("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post reply");
    } finally {
      setPosting(false);
    }
  }

  function toggleLike() {
    const likeMap = safeParse<Record<string, number>>(localStorage.getItem(LS_LIKES), {});
    const next = (likeMap[discussionId] ?? 0) + 1;
    likeMap[discussionId] = next;
    localStorage.setItem(LS_LIKES, JSON.stringify(likeMap));
    setLikes(next);
  }

  function toggleSave() {
    const savedMap = safeParse<Record<string, true>>(localStorage.getItem(LS_SAVED), {});
    if (savedMap[discussionId]) delete savedMap[discussionId];
    else savedMap[discussionId] = true;
    localStorage.setItem(LS_SAVED, JSON.stringify(savedMap));
    setSaved(Boolean(savedMap[discussionId]));
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading discussion…</p>;
  }

  if (error || !discussion) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700 ring-1 ring-rose-200">
        {error ?? "Discussion not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/student/discussions" className="text-sm font-semibold text-[#0B3D91] hover:underline">
        ← Back to discussions
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80"
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B3D91]/10 text-sm font-extrabold text-[#0B3D91]">
            {discussion.authorInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{discussion.authorName}</p>
              {discussion.courseCode ? (
                <span className="rounded-full bg-[#0B3D91]/10 px-2 py-0.5 text-xs font-bold text-[#0B3D91]">
                  {discussion.courseCode}
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${questionStatusStyles(discussion.questionStatus)}`}
              >
                {questionStatusLabel(discussion.questionStatus)}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-slate-900">{discussion.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{discussion.message}</p>
            <p className="mt-3 text-xs text-slate-400">{formatRelative(discussion.createdAt)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={toggleLike}
            className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
          >
            ♥ {likes}
          </button>
          <button
            type="button"
            onClick={toggleSave}
            className={[
              "rounded-xl px-3 py-2 text-xs font-bold ring-1",
              saved ? "bg-[#FFC107] text-[#0B3D91] ring-[#FFC107]" : "bg-white text-slate-700 ring-slate-200",
            ].join(" ")}
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
          >
            Share
          </button>
          <button
            type="button"
            className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-rose-600 ring-1 ring-rose-200"
          >
            Report
          </button>
        </div>
      </motion.article>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{discussion.replyCount} Replies</h2>

        <AnimatePresence>
          {discussion.comments.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <CommentItem comment={c} />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <h3 className="text-sm font-bold text-slate-900">Add a reply</h3>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply… Use @name to mention classmates"
            className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0B3D91]/30 focus:ring-2 focus:ring-[#0B3D91]/10"
          />
          <button
            type="button"
            disabled={posting}
            onClick={() => void postReply()}
            className="mt-3 rounded-xl bg-[#0B3D91] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {posting ? "Posting…" : "Post Reply"}
          </button>
        </div>
      </section>
    </div>
  );
}
