"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StudentSubnav } from "./student-subnav";

const pageMeta: Record<string, { title: string; subtitle: string; addHref?: string; addLabel?: string }> = {
  "/admin/students/all": {
    title: "All Students",
    subtitle: "Browse, search, and manage every registered learner. View profiles, edit details, or remove accounts.",
    addHref: "/admin/students/add",
    addLabel: "Add student",
  },
  "/admin/students/add": {
    title: "Add Student",
    subtitle: "Admit a student for self-registration or create a full account immediately with department and program.",
    addHref: "/admin/students/all",
    addLabel: "View all students",
  },
  "/admin/students/verify": {
    title: "Verify Students",
    subtitle: "Upload admitted IDs, edit pending entries, and track who has completed self-registration.",
    addHref: "/admin/students/add",
    addLabel: "Admit one student",
  },
  "/admin/students/programs": {
    title: "Student Programs",
    subtitle: "Assign or update department, program, and year so students see the correct courses.",
    addHref: "/admin/students/add",
    addLabel: "Add student",
  },
  "/admin/students/attendance": {
    title: "Attendance",
    subtitle: "Record, update, and remove attendance marks for students across live sessions.",
    addHref: "/admin/students/attendance",
    addLabel: "Mark attendance",
  },
  "/admin/students/notifications": {
    title: "Student Messages",
    subtitle: "Send announcements to students and manage past broadcasts — view, edit, or delete.",
    addHref: "/admin/students/notifications",
    addLabel: "New message",
  },
  "/admin/students/reports": {
    title: "Student Reports",
    subtitle: "Platform-wide student metrics, department breakdowns, and exportable academic reports.",
    addHref: "/admin/students/all",
    addLabel: "View students",
  },
};

const studentPaths = new Set([
  "/admin/students/all",
  "/admin/students/add",
  "/admin/students/verify",
  "/admin/students/programs",
  "/admin/students/attendance",
  "/admin/students/notifications",
  "/admin/students/reports",
]);

export function StudentManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = /^\/admin\/students\/[^/]+$/.test(pathname) && !studentPaths.has(pathname);
  const meta = isProfile
    ? { title: "Student Profile", subtitle: "Detailed student information and activity." }
    : pageMeta[pathname] ?? pageMeta["/admin/students/all"];

  return (
    <div className="student-admin-layout mx-auto w-full min-w-0 max-w-[1600px] space-y-5">
      <AdminPageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          isProfile ? (
            <Link
              href="/admin/students/all"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← All students
            </Link>
          ) : meta.addHref && meta.addLabel ? (
            <Link
              href={meta.addHref}
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-400"
            >
              {meta.addLabel}
            </Link>
          ) : null
        }
      />
      {!isProfile ? <StudentSubnav /> : null}
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
