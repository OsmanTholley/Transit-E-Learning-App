"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { LectureNoteRecord } from "@/types/student-lecture-notes";

function FileTypeIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    PDF: "bg-rose-50 text-rose-600",
    DOCX: "bg-blue-50 text-blue-600",
    PPT: "bg-orange-50 text-orange-600",
  };
  const cls = colors[type] ?? "bg-slate-100 text-slate-600";
  return (
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${cls}`}>
      {type}
    </div>
  );
}

export function NoteCard({
  note,
  index = 0,
  onBookmark,
  onDownload,
  isBookmarked,
  isDownloaded,
  readProgress = 0,
}: {
  note: LectureNoteRecord;
  index?: number;
  onBookmark: () => void;
  onDownload: () => void;
  isBookmarked: boolean;
  isDownloaded: boolean;
  readProgress?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md"
    >
      <div className="flex gap-4">
        <FileTypeIcon type={note.fileType} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#0B3D91]/10 px-2 py-0.5 text-xs font-bold text-[#0B3D91]">
              {note.courseCode}
            </span>
            {note.isNew ? (
              <span className="rounded-full bg-[#FFC107]/30 px-2 py-0.5 text-[10px] font-bold text-[#0B3D91]">
                NEW
              </span>
            ) : null}
            {isDownloaded ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Offline
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 font-bold text-slate-900 line-clamp-2">{note.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-1">Topic: {note.topic}</p>
          <p className="mt-1 text-xs text-slate-500">
            {note.lecturerName} · Uploaded {note.uploadedAt} · {note.fileSizeLabel}
          </p>
          {readProgress > 0 ? (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-500">
                <span>Reading progress</span>
                <span>{readProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${readProgress}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/student/lecture-notes/view/${note.id}`}
          className="rounded-xl bg-[#0B3D91] px-4 py-2 text-xs font-semibold text-white hover:bg-[#092d6b]"
        >
          Read
        </Link>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Download
        </button>
        <button
          type="button"
          onClick={onBookmark}
          className={`rounded-xl px-4 py-2 text-xs font-semibold ${
            isBookmarked ? "bg-[#FFC107]/20 text-[#0B3D91]" : "border border-slate-200 text-slate-600"
          }`}
        >
          {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              void navigator.share({ title: note.title, url: note.fileUrl });
            }
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Share
        </button>
      </div>
    </motion.article>
  );
}
