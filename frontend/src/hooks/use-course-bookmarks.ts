"use client";

import { useCallback, useEffect, useState } from "react";

export type BookmarkItem = {
  id: string;
  type: "note" | "video" | "discussion";
  title: string;
  courseTitle: string;
  href: string;
  savedAt: string;
};

const STORAGE_KEY = "transit_course_bookmarks";

export function useCourseBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setBookmarks(JSON.parse(raw) as BookmarkItem[]);
      } catch {
        setBookmarks([]);
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const persist = useCallback((next: BookmarkItem[]) => {
    setBookmarks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, "savedAt">) => {
      const exists = bookmarks.some((b) => b.id === item.id && b.type === item.type);
      if (exists) {
        persist(bookmarks.filter((b) => !(b.id === item.id && b.type === item.type)));
        return false;
      }
      persist([{ ...item, savedAt: new Date().toISOString() }, ...bookmarks]);
      return true;
    },
    [bookmarks, persist]
  );

  const isBookmarked = useCallback(
    (id: string, type: BookmarkItem["type"]) => bookmarks.some((b) => b.id === id && b.type === type),
    [bookmarks]
  );

  return { bookmarks, toggleBookmark, isBookmarked };
}
