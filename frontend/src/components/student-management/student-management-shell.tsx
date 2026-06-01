"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StudentSubnav } from "./student-subnav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/students/all": {
    title: "All Students",
    subtitle: "Manage registered learners, verify accounts, and control platform access.",
  },
  "/admin/students/add": {
    title: "Add Student",
    subtitle: "Admit students for self-registration or create accounts immediately.",
  },
  "/admin/students/verify": {
    title: "Verify Students",
    subtitle: "Upload admitted student IDs (CSV) and monitor registration status.",
  },
  "/admin/students/programs": {
    title: "Student Programs",
    subtitle: "Assign department, program, year, and semester for course access.",
  },
  "/admin/students/attendance": {
    title: "Attendance",
    subtitle: "Monitor participation and export attendance reports.",
  },
  "/admin/students/notifications": {
    title: "Messages",
    subtitle: "Send messages to individual students, departments, years, or everyone.",
  },
  "/admin/students/reports": {
    title: "Reports",
    subtitle: "Performance analytics, exports, and academic reporting in one place.",
  },
};

const studentPaths = new Set(Object.keys(pageMeta));

export function StudentManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = /^\/admin\/students\/[^/]+$/.test(pathname) && !studentPaths.has(pathname);
  const meta = isProfile
    ? { title: "Student Profile", subtitle: "Detailed student information and activity." }
    : pageMeta[pathname] ?? pageMeta["/admin/students/all"];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <AdminPageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          !isProfile ? (
            <Link
              href="/admin/students/add"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Add student
            </Link>
          ) : (
            <Link
              href="/admin/students/all"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← All students
            </Link>
          )
        }
      />
      {!isProfile ? <StudentSubnav /> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
