"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApiLoad } from "@/hooks/use-api-load";
import { useCourseBookmarks } from "@/hooks/use-course-bookmarks";
import { useLectureNotesLibrary } from "@/hooks/use-lecture-notes-library";
import { NoteCard } from "@/components/student/lecture-notes/note-card";
import { NotesFilters } from "@/components/student/lecture-notes/notes-filters";
import { notesViewTitle } from "@/components/student/lecture-notes/notes-nav-config";
import {
  EmptyState,
  LoadingGrid,
  PageHeader,
  ProgressRing,
  StatOverviewCard,
} from "@/components/student/courses/ui/course-ui";
import type { LectureNoteRecord, LectureNotesListResponse } from "@/types/student-lecture-notes";

function applyFilters(
  notes: LectureNoteRecord[],
  search: string,
  fileType: string,
  courseId: string,
  semester: string
) {
  let list = notes;
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.topic.toLowerCase().includes(q) ||
        n.courseCode.toLowerCase().includes(q) ||
        n.courseTitle.toLowerCase().includes(q) ||
        n.lecturerName.toLowerCase().includes(q) ||
        n.fileType.toLowerCase().includes(q)
    );
  }
  if (fileType) list = list.filter((n) => n.fileType === fileType);
  if (courseId) list = list.filter((n) => n.courseId === courseId);
  if (semester) list = list.filter((n) => n.semester === semester);
  return list;
}

export function NotesHub({ view = "" }: { view?: string }) {
  const { data, loading, error } = useApiLoad<LectureNotesListResponse>(
    "/api/student/lecture-notes",
    { errorTitle: "Could not load notes" }
  );
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("");
  const [courseId, setCourseId] = useState("");
  const [semester, setSemester] = useState("");

  const { bookmarks, toggleBookmark, isBookmarked } = useCourseBookmarks();
  const library = useLectureNotesLibrary();

  const noteBookmarks = useMemo(
    () => bookmarks.filter((b) => b.type === "note"),
    [bookmarks]
  );

  const displayNotes = useMemo(() => {
    if (!data) return [];
    let list = data.notes;

    switch (view) {
      case "recent": {
        const recentIds = new Set(library.recent.map((r) => r.noteId));
        const recent = list.filter((n) => recentIds.has(n.id) || n.isNew);
        list = recent.length ? recent : list.slice(0, 10);
        break;
      }
      case "downloaded":
        list = list.filter((n) => library.isDownloaded(n.id));
        break;
      case "bookmarked":
        list = list.filter((n) => isBookmarked(n.id, "note"));
        break;
      case "shared":
        list = list.filter((n) => n.isShared);
        break;
      case "search":
        break;
      default:
        break;
    }

    return applyFilters(list, search, fileType, courseId, semester);
  }, [data, view, search, fileType, courseId, semester, library, isBookmarked]);

  const stats = useMemo(() => {
    if (!data) return null;
    const readCount = data.notes.filter((n) => library.getProgress(n.id) > 0).length;
    const avgProgress =
      data.notes.length > 0
        ? Math.round(
            data.notes.reduce((sum, n) => sum + library.getProgress(n.id), 0) / data.notes.length
          )
        : 0;
    return {
      ...data.stats,
      downloadedNotes: library.downloads.length,
      bookmarkedNotes: noteBookmarks.length,
      readCount,
      averageReadingProgress: avgProgress,
    };
  }, [data, library, noteBookmarks]);

  const title = notesViewTitle(view);
  const subtitles: Record<string, string> = {
    "": "Your digital academic library — all materials from assigned courses",
    recent: "New uploads and recently opened materials",
    downloaded: "Offline materials saved on this device",
    bookmarked: "Your saved study references",
    "by-course": "Browse notes organized by course",
    "by-semester": "Filter materials by academic semester",
    shared: "Lecturer shared and supplementary readings",
    progress: "Track what you have read and completed",
    search: "Powerful search across all your lecture materials",
  };

  if (loading) return <LoadingGrid />;
  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
    );
  }

  if (view === "progress" && data) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} subtitle={subtitles.progress} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatOverviewCard label="Notes read" value={stats?.readCount ?? 0} sub="Started reading" tone="blue" />
          <StatOverviewCard
            label="Avg. progress"
            value={`${stats?.averageReadingProgress ?? 0}%`}
            sub="Across all notes"
            tone="yellow"
          />
          <StatOverviewCard label="Downloaded" value={stats?.downloadedNotes ?? 0} sub="Offline copies" tone="green" />
          <StatOverviewCard label="Bookmarked" value={stats?.bookmarkedNotes ?? 0} sub="Saved for study" tone="rose" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data.notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/80"
            >
              <ProgressRing percent={library.getProgress(note.id)} size={72} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 line-clamp-1">{note.title}</p>
                <p className="text-xs text-slate-500">{note.courseCode}</p>
                <Link
                  href={`/student/lecture-notes/view/${note.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-[#0B3D91]"
                >
                  Continue reading →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        {data.notes.length === 0 ? (
          <EmptyState title="No reading activity" message="Open a note to start tracking progress." />
        ) : null}
      </div>
    );
  }

  if (view === "by-course" && data) {
    const grouped = data.courses.map((c) => ({
      ...c,
      notes: applyFilters(
        data.notes.filter((n) => n.courseId === c.id),
        search,
        fileType,
        "",
        semester
      ),
    }));

    return (
      <div className="space-y-6">
        <PageHeader title={title} subtitle={subtitles["by-course"]} />
        <NotesFilters
          search={search}
          onSearchChange={setSearch}
          fileType={fileType}
          onFileTypeChange={setFileType}
          courseId={courseId}
          onCourseChange={setCourseId}
          semester={semester}
          onSemesterChange={setSemester}
          courses={data.courses}
          semesters={data.semesters}
        />
        {grouped.map((group) => (
          <section key={group.id} className="space-y-3">
            <h2 className="text-lg font-bold text-[#0B3D91]">
              {group.code} → {group.title}
            </h2>
            <p className="text-xs text-slate-500">{group.noteCount} materials</p>
            {group.notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes match your filters.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {group.notes.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={i}
                    isBookmarked={isBookmarked(note.id, "note")}
                    isDownloaded={library.isDownloaded(note.id)}
                    readProgress={library.getProgress(note.id)}
                    onBookmark={() =>
                      toggleBookmark({
                        id: note.id,
                        type: "note",
                        title: note.title,
                        courseTitle: note.courseTitle,
                        href: `/student/lecture-notes/view/${note.id}`,
                      })
                    }
                    onDownload={() =>
                      library.markDownloaded({
                        noteId: note.id,
                        title: note.title,
                        courseCode: note.courseCode,
                        fileType: note.fileType,
                        fileUrl: note.fileUrl,
                        fileSizeLabel: note.fileSizeLabel,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    );
  }

  if (view === "by-semester" && data) {
    const semList = data.semesters.length ? data.semesters : ["First", "Second"];
    return (
      <div className="space-y-6">
        <PageHeader title={title} subtitle={subtitles["by-semester"]} />
        {semList.map((sem) => {
          const semNotes = displayNotes.filter((n) => n.semester === sem || (!n.semester && sem === "First"));
          return (
            <section key={sem} className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Semester: {sem}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {semNotes.map((note, i) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={i}
                    isBookmarked={isBookmarked(note.id, "note")}
                    isDownloaded={library.isDownloaded(note.id)}
                    readProgress={library.getProgress(note.id)}
                    onBookmark={() =>
                      toggleBookmark({
                        id: note.id,
                        type: "note",
                        title: note.title,
                        courseTitle: note.courseTitle,
                        href: `/student/lecture-notes/view/${note.id}`,
                      })
                    }
                    onDownload={() =>
                      library.markDownloaded({
                        noteId: note.id,
                        title: note.title,
                        courseCode: note.courseCode,
                        fileType: note.fileType,
                        fileUrl: note.fileUrl,
                        fileSizeLabel: note.fileSizeLabel,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  if (view === "downloaded") {
    return (
      <div className="space-y-6">
        <PageHeader title={title} subtitle={subtitles.downloaded} />
        <div className="rounded-2xl bg-[#0B3D91]/5 p-4 text-sm text-[#0B3D91]">
          Storage used: <strong>{library.storageUsedLabel}</strong> · {library.downloads.length} files
        </div>
        {library.downloads.length === 0 ? (
          <EmptyState title="No downloads yet" message="Download notes for offline reading when internet is limited." />
        ) : (
          <ul className="space-y-3">
            {library.downloads.map((d) => (
              <li key={d.noteId} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-200/80">
                <div>
                  <p className="font-semibold text-slate-900">{d.title}</p>
                  <p className="text-xs text-slate-500">
                    {d.courseCode} · {d.fileType} · {d.fileSizeLabel} ·{" "}
                    {new Date(d.downloadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/student/lecture-notes/view/${d.noteId}`}
                  className="rounded-xl bg-[#0B3D91] px-4 py-2 text-xs font-semibold text-white"
                >
                  Open offline
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitles[view] ?? subtitles[""]} />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatOverviewCard label="Total Notes" value={stats.totalNotes} sub="Available" tone="blue" />
          <StatOverviewCard label="Downloaded" value={stats.downloadedNotes} sub="Offline copies" tone="green" />
          <StatOverviewCard label="Bookmarked" value={stats.bookmarkedNotes} sub="Saved" tone="yellow" />
          <StatOverviewCard label="Recently Added" value={stats.recentlyAdded} sub="Last 7 days" tone="rose" />
        </div>
      ) : null}

      {view !== "downloaded" ? (
        <NotesFilters
          search={search}
          onSearchChange={setSearch}
          fileType={fileType}
          onFileTypeChange={setFileType}
          courseId={courseId}
          onCourseChange={setCourseId}
          semester={semester}
          onSemesterChange={setSemester}
          courses={data?.courses ?? []}
          semesters={data?.semesters ?? []}
        />
      ) : null}

      {view === "" && stats && stats.recentlyAdded > 0 ? (
        <div className="rounded-2xl border border-[#FFC107]/40 bg-[#FFC107]/10 px-4 py-3 text-sm text-[#0B3D91]">
          <strong>{stats.recentlyAdded}</strong> new lecture {stats.recentlyAdded === 1 ? "note" : "notes"} uploaded
          this week. Check Recent Notes for updates.
        </div>
      ) : null}

      {displayNotes.length === 0 ? (
        <EmptyState
          title="No lecture notes found"
          message="Notes from your enrolled courses will appear here when lecturers upload materials."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {displayNotes.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              index={i}
              isBookmarked={isBookmarked(note.id, "note")}
              isDownloaded={library.isDownloaded(note.id)}
              readProgress={library.getProgress(note.id)}
              onBookmark={() =>
                toggleBookmark({
                  id: note.id,
                  type: "note",
                  title: note.title,
                  courseTitle: note.courseTitle,
                  href: `/student/lecture-notes/view/${note.id}`,
                })
              }
              onDownload={() =>
                library.markDownloaded({
                  noteId: note.id,
                  title: note.title,
                  courseCode: note.courseCode,
                  fileType: note.fileType,
                  fileUrl: note.fileUrl,
                  fileSizeLabel: note.fileSizeLabel,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
