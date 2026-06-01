"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LecturerSubnav } from "./lecturer-subnav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/lecturers/all": {
    title: "All Lecturers",
    subtitle: "Manage lecturer accounts, course assignments, and platform access.",
  },
  "/admin/lecturers/add": {
    title: "Add Lecturer",
    subtitle: "Create lecturer login credentials. They complete their profile after signing in.",
  },
  "/admin/lecturers/assign-courses": {
    title: "Assign Courses",
    subtitle: "Assign lecturers to courses from the academic catalog.",
  },
  "/admin/lecturers/materials": {
    title: "Uploaded Materials",
    subtitle: "Monitor and approve lecture notes, videos, assignments, and quizzes.",
  },
  "/admin/lecturers/notifications": {
    title: "Messages",
    subtitle: "Send messages to individual lecturers, departments, or all lecturers.",
  },
  "/admin/lecturers/suspended": {
    title: "Suspended Lecturers",
    subtitle: "Review inactive accounts and discipline cases.",
  },
  "/admin/lecturers/reports": {
    title: "Lecturer Reports",
    subtitle: "Generate and export lecturer and teaching activity reports.",
  },
};

const lecturerPaths = new Set(Object.keys(pageMeta));

export function LecturerManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = /^\/admin\/lecturers\/[^/]+$/.test(pathname) && !lecturerPaths.has(pathname);
  const meta = isProfile
    ? { title: "Lecturer Profile", subtitle: "Detailed lecturer information and teaching activity." }
    : pageMeta[pathname] ?? pageMeta["/admin/lecturers/all"];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <AdminPageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          !isProfile ? (
            <Link
              href="/admin/lecturers/add"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Add lecturer
            </Link>
          ) : (
            <Link
              href="/admin/lecturers/all"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← All lecturers
            </Link>
          )
        }
      />
      {!isProfile ? <LecturerSubnav /> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
