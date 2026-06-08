"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type ContentCrudSection =
  | "lecture-notes"
  | "videos"
  | "assignments"
  | "quizzes"
  | "discussions"
  | "ai-tutor"
  | "files"
  | "approval"
  | "reported"
  | "analytics";

const sectionMeta: Record<
  ContentCrudSection,
  { kicker: string; title: string; description: string; addHref?: string; addLabel?: string }
> = {
  "lecture-notes": {
    kicker: "Course materials",
    title: "Lecture notes",
    description: "View, edit, and remove uploaded notes. Monitor approval status across departments and courses.",
    addHref: "/admin/content/lecture-notes",
    addLabel: "Upload note",
  },
  videos: {
    kicker: "Video library",
    title: "Videos",
    description: "Manage lecture videos uploaded by lecturers — watch, update metadata, or delete when no longer needed.",
    addHref: "/admin/content/videos",
    addLabel: "Add video",
  },
  assignments: {
    kicker: "Coursework",
    title: "Assignments",
    description: "Review assignment briefs, deadlines, and submission activity. Edit or remove outdated tasks.",
    addHref: "/admin/content/assignments",
    addLabel: "Create assignment",
  },
  quizzes: {
    kicker: "Assessments",
    title: "Quizzes",
    description: "Manage quiz content, questions, and course linkage from one dashboard.",
    addHref: "/admin/content/quizzes",
    addLabel: "Create quiz",
  },
  discussions: {
    kicker: "Community",
    title: "Discussions",
    description: "Moderate course threads, edit posts, and remove spam or inappropriate content.",
    addHref: "/admin/content/discussions",
    addLabel: "New thread",
  },
  "ai-tutor": {
    kicker: "AI resources",
    title: "AI tutor content",
    description: "Track AI tutor usage and manage supporting academic resources.",
    addHref: "/admin/content/analytics",
    addLabel: "View analytics",
  },
  files: {
    kicker: "File vault",
    title: "Uploaded files",
    description: "All notes, videos, assignments, and quizzes in one searchable library.",
    addHref: "/admin/content/files",
    addLabel: "Browse files",
  },
  approval: {
    kicker: "Moderation",
    title: "Content approval",
    description: "Review recent uploads before they reach students. Approve, edit, or remove items.",
    addHref: "/admin/content/approval",
    addLabel: "Review queue",
  },
  reported: {
    kicker: "Safety",
    title: "Reported content",
    description: "Investigate student and lecturer reports. Take action on flagged material.",
    addHref: "/admin/content/reported",
    addLabel: "View reports",
  },
  analytics: {
    kicker: "Insights",
    title: "Content analytics",
    description: "Upload trends, active lecturers, and platform-wide content health at a glance.",
    addHref: "/admin/content/analytics",
    addLabel: "Open dashboard",
  },
};

export function ContentCrudPageHero({
  section,
  actions,
}: {
  section: ContentCrudSection;
  actions?: ReactNode;
}) {
  const meta = sectionMeta[section];

  return (
    <section className="admin-crud-hero">
      <div className="admin-crud-hero-inner">
        <div>
          <p className="admin-crud-hero-kicker">{meta.kicker}</p>
          <h1 className="admin-crud-hero-title">{meta.title}</h1>
          <p className="admin-crud-hero-desc">{meta.description}</p>
        </div>
        <div className="admin-crud-hero-actions">
          {actions}
          {meta.addHref && meta.addLabel ? (
            <Link href={meta.addHref} className="admin-crud-add-btn">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
                <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z" />
              </svg>
              {meta.addLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
