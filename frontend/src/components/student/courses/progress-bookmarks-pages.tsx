"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useApiLoad } from "@/hooks/use-api-load";
import { useCourseBookmarks } from "@/hooks/use-course-bookmarks";
import {
  EmptyState,
  LoadingGrid,
  PageHeader,
  ProgressRing,
  StatOverviewCard,
} from "@/components/student/courses/ui/course-ui";
import type { CoursesListResponse } from "@/types/student-courses";

export function CourseProgressPage() {
  const { data, loading } = useApiLoad<CoursesListResponse>("/api/student/courses?filter=all", {
    errorTitle: "Could not load progress",
  });

  if (loading) return <LoadingGrid />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Progress"
        subtitle="Track lessons, assignments, and quiz completion across all courses"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatOverviewCard label="Total Courses" value={data.stats.totalCourses} sub="Enrolled" />
        <StatOverviewCard label="Completed" value={data.stats.completedCourses} sub="100% progress" tone="green" />
        <StatOverviewCard label="Pending Work" value={data.stats.pendingAssignments} sub="Assignments" tone="yellow" />
        <StatOverviewCard label="Quiz Average" value={`${data.stats.averageQuizScore}%`} sub="Semester" tone="rose" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.courses.map((course, i) => (
          <motion.article
            key={course.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80"
          >
            <ProgressRing percent={course.progress} />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900">{course.title}</h3>
              <p className="text-sm text-slate-500">{course.code}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-bold text-[#0B3D91]">{course.stats.lectureNotes}</p>
                  <p className="text-slate-500">Notes</p>
                </div>
                <div>
                  <p className="font-bold text-[#0B3D91]">{course.stats.assignments}</p>
                  <p className="text-slate-500">Tasks</p>
                </div>
                <div>
                  <p className="font-bold text-[#0B3D91]">{course.stats.quizzes}</p>
                  <p className="text-slate-500">Quizzes</p>
                </div>
              </div>
              <Link
                href={`/student/courses/${course.id}`}
                className="mt-3 inline-block text-sm font-semibold text-[#0B3D91] hover:underline"
              >
                View details →
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
      {data.courses.length === 0 ? (
        <EmptyState title="No progress yet" message="Enroll in courses to start tracking your learning journey." />
      ) : null}
    </div>
  );
}

export function BookmarksPage() {
  const { bookmarks } = useCourseBookmarks();

  return (
    <div className="space-y-6">
      <PageHeader title="Bookmarks" subtitle="Saved notes, videos, and discussions" />
      {bookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          message="Bookmark lecture notes or videos from any course to access them quickly here."
        />
      ) : (
        <ul className="space-y-3">
          {bookmarks.map((b) => (
            <li key={`${b.type}-${b.id}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
              <span className="rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-xs font-medium text-[#0B3D91] capitalize">
                {b.type}
              </span>
              <h3 className="mt-2 font-semibold text-slate-900">{b.title}</h3>
              <p className="text-sm text-slate-500">{b.courseTitle}</p>
              <Link href={b.href} className="mt-3 inline-block text-sm font-semibold text-[#0B3D91] hover:underline">
                Open →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
