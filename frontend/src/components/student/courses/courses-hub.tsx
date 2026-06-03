"use client";

import { AllCoursesPage } from "@/components/student/courses/all-courses-page";
import { CoursesSubNav } from "@/components/student/courses/courses-sub-nav";
import { CourseDetailPage } from "@/components/student/courses/course-detail-page";
import { MaterialsPage } from "@/components/student/courses/materials-pages";
import { BookmarksPage, CourseProgressPage } from "@/components/student/courses/progress-bookmarks-pages";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function CoursesHubContent({
  segment,
  filter,
}: {
  segment?: string[];
  filter?: string | null;
}) {
  const view = segment?.[0] ?? "";

  if (view && UUID_RE.test(view)) {
    return <CourseDetailPage courseId={view} />;
  }

  switch (view) {
    case "":
      return <AllCoursesPage filter={filter === "completed" ? "completed" : "all"} />;
    case "current-semester":
      return <AllCoursesPage filter="current-semester" />;
    case "lecture-notes":
      return <MaterialsPage type="lecture-notes" />;
    case "videos":
      return <MaterialsPage type="videos" />;
    case "assignments":
      return <MaterialsPage type="assignments" />;
    case "quizzes":
      return <MaterialsPage type="quizzes" />;
    case "discussions":
      return <MaterialsPage type="discussions" />;
    case "bookmarks":
      return <BookmarksPage />;
    case "progress":
      return <CourseProgressPage />;
    default:
      return <AllCoursesPage filter="all" />;
  }
}

export function CoursesHub({
  segment,
  filter,
}: {
  segment?: string[];
  filter?: string | null;
}) {
  const view = segment?.[0] ?? "";
  const isCourseDetail = view && UUID_RE.test(view);

  return (
    <div className="space-y-5">
      {!isCourseDetail ? <CoursesSubNav activeFilter={filter ?? null} /> : null}
      <CoursesHubContent segment={segment} filter={filter} />
    </div>
  );
}
