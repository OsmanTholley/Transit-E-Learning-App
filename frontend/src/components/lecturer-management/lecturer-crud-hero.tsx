"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type LecturerCrudSection =
  | "all"
  | "add"
  | "assign"
  | "materials"
  | "messages"
  | "suspended"
  | "reports";

const sectionMeta: Record<
  LecturerCrudSection,
  { kicker: string; title: string; description: string; addHref?: string; addLabel?: string }
> = {
  all: {
    kicker: "Lecturer registry",
    title: "All lecturers",
    description: "Browse, search, and manage lecturer accounts. View profiles, edit details, or remove access.",
    addHref: "/admin/lecturers/add",
    addLabel: "Add lecturer",
  },
  add: {
    kicker: "Onboarding",
    title: "Add lecturer",
    description: "Create lecturer login credentials. They complete their profile after first sign-in.",
    addHref: "/admin/lecturers/all",
    addLabel: "View all lecturers",
  },
  assign: {
    kicker: "Course allocation",
    title: "Assign courses",
    description: "Link lecturers to courses from the academic catalog and review current assignments.",
    addHref: "/admin/lecturers/assign-courses",
    addLabel: "New assignment",
  },
  materials: {
    kicker: "Content oversight",
    title: "Uploaded materials",
    description: "Monitor lecture notes, videos, assignments, and quizzes uploaded by lecturers.",
    addHref: "/admin/content/lecture-notes",
    addLabel: "Manage content",
  },
  messages: {
    kicker: "Communications",
    title: "Lecturer messages",
    description: "Send announcements to lecturers and manage past broadcasts — view, edit, or delete.",
    addHref: "/admin/lecturers/notifications",
    addLabel: "New message",
  },
  suspended: {
    kicker: "Discipline",
    title: "Suspended lecturers",
    description: "Review inactive accounts, warnings, and suspension cases. Reinstate or remove access.",
    addHref: "/admin/lecturers/all",
    addLabel: "All lecturers",
  },
  reports: {
    kicker: "Analytics",
    title: "Lecturer reports",
    description: "Teaching activity metrics, course assignments, and exportable lecturer reports.",
    addHref: "/admin/lecturers/all",
    addLabel: "View lecturers",
  },
};

export function LecturerCrudPageHero({
  section,
  actions,
}: {
  section: LecturerCrudSection;
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
