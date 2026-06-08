"use client";

import { useCallback } from "react";
import { STUDENT_PREF_KEYS } from "@/lib/student-preference-keys";
import { useStudentPreference } from "@/hooks/use-student-preference";

export type BookmarkItem = {
  id: string;
  type: "note" | "video" | "discussion";
  title: string;
  courseTitle: string;
  href: string;
  savedAt: string;
};

const EMPTY_BOOKMARKS: BookmarkItem[] = [];

export function useCourseBookmarks() {
  const [bookmarks, setBookmarks] = useStudentPreference<BookmarkItem[]>(
    STUDENT_PREF_KEYS.courseBookmarks,
    EMPTY_BOOKMARKS
  );

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, "savedAt">) => {
      let added = false;
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.id === item.id && b.type === item.type);
        if (exists) {
          added = false;
          return prev.filter((b) => !(b.id === item.id && b.type === item.type));
        }
        added = true;
        return [{ ...item, savedAt: new Date().toISOString() }, ...prev];
      });
      return added;
    },
    [setBookmarks]
  );

  const isBookmarked = useCallback(
    (id: string, type: BookmarkItem["type"]) =>
      bookmarks.some((b) => b.id === id && b.type === type),
    [bookmarks]
  );

  return { bookmarks, toggleBookmark, isBookmarked };
}
