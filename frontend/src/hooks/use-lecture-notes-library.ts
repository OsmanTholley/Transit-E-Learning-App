"use client";

import { useCallback, useEffect, useState } from "react";

export type DownloadRecord = {
  noteId: string;
  title: string;
  courseCode: string;
  fileType: string;
  fileUrl: string;
  fileSizeLabel: string;
  downloadedAt: string;
};

export type ReadingProgress = {
  noteId: string;
  percent: number;
  lastReadAt: string;
};

export type RecentView = {
  noteId: string;
  viewedAt: string;
};

const KEYS = {
  downloads: "transit_notes_downloads",
  progress: "transit_notes_progress",
  recent: "transit_notes_recent",
};

export function useLectureNotesLibrary() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [progress, setProgress] = useState<Record<string, ReadingProgress>>({});
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const d = localStorage.getItem(KEYS.downloads);
        const p = localStorage.getItem(KEYS.progress);
        const r = localStorage.getItem(KEYS.recent);
        if (d) setDownloads(JSON.parse(d) as DownloadRecord[]);
        if (p) setProgress(JSON.parse(p) as Record<string, ReadingProgress>);
        if (r) setRecent(JSON.parse(r) as RecentView[]);
      } catch {
        /* ignore */
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const markDownloaded = useCallback((record: Omit<DownloadRecord, "downloadedAt">) => {
    setDownloads((prev) => {
      const filtered = prev.filter((x) => x.noteId !== record.noteId);
      const next = [{ ...record, downloadedAt: new Date().toISOString() }, ...filtered];
      localStorage.setItem(KEYS.downloads, JSON.stringify(next));
      return next;
    });
  }, []);

  const isDownloaded = useCallback(
    (noteId: string) => downloads.some((d) => d.noteId === noteId),
    [downloads]
  );

  const setReadingProgress = useCallback((noteId: string, percent: number) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        [noteId]: { noteId, percent: Math.min(100, Math.max(0, percent)), lastReadAt: new Date().toISOString() },
      };
      localStorage.setItem(KEYS.progress, JSON.stringify(next));
      return next;
    });
  }, []);

  const getProgress = useCallback((noteId: string) => progress[noteId]?.percent ?? 0, [progress]);

  const markRecentView = useCallback((noteId: string) => {
    setRecent((prev) => {
      const next = [{ noteId, viewedAt: new Date().toISOString() }, ...prev.filter((r) => r.noteId !== noteId)].slice(
        0,
        30
      );
      localStorage.setItem(KEYS.recent, JSON.stringify(next));
      return next;
    });
  }, []);

  const storageUsedLabel = `${(downloads.length * 2.4).toFixed(1)} MB (est.)`;

  return {
    ready,
    downloads,
    progress,
    recent,
    markDownloaded,
    isDownloaded,
    setReadingProgress,
    getProgress,
    markRecentView,
    storageUsedLabel,
  };
}
