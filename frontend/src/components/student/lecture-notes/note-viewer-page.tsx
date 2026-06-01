"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCourseBookmarks } from "@/hooks/use-course-bookmarks";
import { useLectureNotesLibrary } from "@/hooks/use-lecture-notes-library";
import type { LectureNoteRecord } from "@/types/student-lecture-notes";

export function NoteViewerPage({ noteId }: { noteId: string }) {
  const [note, setNote] = useState<LectureNoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [darkMode, setDarkMode] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(12);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const { toggleBookmark, isBookmarked } = useCourseBookmarks();
  const { markDownloaded, markRecentView, setReadingProgress, getProgress, isDownloaded } =
    useLectureNotesLibrary();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/student/lecture-notes/${noteId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load note");
        setNote(json);
        markRecentView(noteId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load note");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [noteId, markRecentView]);

  useEffect(() => {
    const p = getProgress(noteId);
    const nextPage = Math.max(1, Math.round((p / 100) * totalPages) || 1);
    const t = window.setTimeout(() => setPage(nextPage), 0);
    return () => window.clearTimeout(t);
  }, [noteId, getProgress, totalPages]);

  useEffect(() => {
    setReadingProgress(noteId, Math.round((page / totalPages) * 100));
  }, [page, noteId, totalPages, setReadingProgress]);

  async function askAi() {
    if (!aiQuestion.trim() || !note) return;
    const q = aiQuestion.trim();
    setAiMessages((m) => [...m, { role: "user", text: q }]);
    setAiQuestion("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/student/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `From the lecture note "${note.title}" (${note.courseCode}): ${q}`,
          courseTitle: note.courseTitle,
        }),
      });
      const json = await res.json();
      setAiMessages((m) => [...m, { role: "ai", text: json.answer ?? json.error }]);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Opening document...</p>;
  if (error || !note) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error ?? "Note not found"}
        <Link href="/student/lecture-notes" className="ml-2 font-semibold underline">
          Back to library
        </Link>
      </div>
    );
  }

  const progress = getProgress(noteId);
  const canEmbedPdf = note.fileType === "PDF" && note.fileUrl.startsWith("http");

  return (
    <div className="space-y-4">
      <Link href="/student/lecture-notes" className="text-sm font-semibold text-[#0B3D91] hover:underline">
        ← Lecture Notes Library
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{note.title}</h1>
          <p className="text-sm text-[#0B3D91] font-medium">{note.courseCode} — {note.courseTitle}</p>
          <p className="text-xs text-slate-500">
            {note.lecturerName} · {note.uploadedAt} · {note.fileSizeLabel}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-[#0B3D91]">Reading: {progress}%</p>
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
        <a
          href={note.fileUrl}
          download
          onClick={() =>
            markDownloaded({
              noteId: note.id,
              title: note.title,
              courseCode: note.courseCode,
              fileType: note.fileType,
              fileUrl: note.fileUrl,
              fileSizeLabel: note.fileSizeLabel,
            })
          }
          className="rounded-lg bg-[#0B3D91] px-3 py-2 text-xs font-semibold text-white"
        >
          Download
        </a>
        <button
          type="button"
          onClick={() =>
            toggleBookmark({
              id: note.id,
              type: "note",
              title: note.title,
              courseTitle: note.courseTitle,
              href: `/student/lecture-notes/view/${note.id}`,
            })
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
        >
          {isBookmarked(note.id, "note") ? "★ Bookmarked" : "☆ Bookmark"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
        >
          Print
        </button>
        <button
          type="button"
          onClick={() => setDarkMode((d) => !d)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
        >
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
        >
          −
        </button>
        <span className="text-xs font-medium text-slate-600">{zoom}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(200, z + 10))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
        >
          +
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => setAiOpen((o) => !o)}
          className="ml-auto rounded-lg bg-[#FFC107] px-3 py-2 text-xs font-semibold text-[#0B3D91]"
        >
          AI Tutor
        </button>
        {isDownloaded(note.id) ? (
          <span className="text-xs font-medium text-emerald-600">Saved offline</span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`lg:col-span-2 ${aiOpen ? "" : "lg:col-span-3"}`}>
          <motion.div
            layout
            className={`overflow-hidden rounded-2xl shadow-sm ring-1 ${
              darkMode ? "bg-slate-900 ring-slate-700" : "bg-white ring-slate-200/80"
            }`}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <div className={`min-h-[60vh] ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}>
              {canEmbedPdf ? (
                <iframe
                  title={note.title}
                  src={`${note.fileUrl}#page=${page}`}
                  className="h-[70vh] w-full border-0"
                />
              ) : (
                <div className="flex h-[70vh] flex-col items-center justify-center p-8 text-center">
                  <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                    {note.fileType} preview
                  </p>
                  <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {note.fileType === "DOCX" || note.fileType === "PPT"
                      ? "Download this file to open in Microsoft Word or PowerPoint."
                      : "Open the file using the download button."}
                  </p>
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 rounded-xl bg-[#0B3D91] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Open / Download file
                  </a>
                </div>
              )}
            </div>
          </motion.div>
          {note.description ? (
            <p className="mt-3 text-sm text-slate-600">{note.description}</p>
          ) : null}
        </div>

        <AnimatePresence>
          {aiOpen ? (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 lg:col-span-1"
            >
              <h3 className="font-bold text-[#0B3D91]">AI Tutor</h3>
              <p className="text-xs text-slate-500">Ask about this note&apos;s content</p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {aiMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 text-xs whitespace-pre-wrap ${
                      m.role === "user" ? "bg-[#0B3D91] text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askAi()}
                  placeholder="Explain Snell's Law from this note..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={askAi}
                  disabled={aiLoading}
                  className="rounded-lg bg-[#FFC107] px-3 py-2 text-xs font-bold text-[#0B3D91]"
                >
                  Ask
                </button>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
