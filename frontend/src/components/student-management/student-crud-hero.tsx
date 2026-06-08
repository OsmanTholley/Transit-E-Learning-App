"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type StudentCrudSection =
  | "all"
  | "add"
  | "verify"
  | "programs"
  | "attendance"
  | "messages"
  | "reports";

const sectionMeta: Record<
  StudentCrudSection,
  { kicker: string; title: string; description: string; addHref?: string; addLabel?: string }
> = {
  all: {
    kicker: "Student registry",
    title: "All students",
    description: "Browse, search, and manage every registered learner. View profiles, edit details, or remove accounts.",
    addHref: "/admin/students/add",
    addLabel: "Add student",
  },
  add: {
    kicker: "Enrollment",
    title: "Add student",
    description: "Admit a student for self-registration or create a full account immediately with department and program.",
    addHref: "/admin/students/all",
    addLabel: "View all students",
  },
  verify: {
    kicker: "Registration gate",
    title: "Verify students",
    description: "Upload admitted IDs, edit pending entries, and track who has completed self-registration.",
    addHref: "/admin/students/add",
    addLabel: "Admit one student",
  },
  programs: {
    kicker: "Academic placement",
    title: "Student programs",
    description: "Assign or update department, program, and year so students see the correct courses.",
    addHref: "/admin/students/add",
    addLabel: "Add student",
  },
  attendance: {
    kicker: "Participation",
    title: "Attendance",
    description: "Record, update, and remove attendance marks for students across live sessions.",
    addHref: "/admin/students/attendance",
    addLabel: "Mark attendance",
  },
  messages: {
    kicker: "Communications",
    title: "Student messages",
    description: "Send announcements to students and manage past broadcasts — view, edit, or delete.",
    addHref: "/admin/students/notifications",
    addLabel: "New message",
  },
  reports: {
    kicker: "Analytics",
    title: "Student reports",
    description: "Platform-wide student metrics, department breakdowns, and exportable academic reports.",
    addHref: "/admin/students/all",
    addLabel: "View students",
  },
};

export function StudentCrudPageHero({
  section,
  actions,
}: {
  section: StudentCrudSection;
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
