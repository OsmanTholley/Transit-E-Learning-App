"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StudentSubnav } from "./student-subnav";

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

  return (
    <div className="student-admin-layout mx-auto w-full min-w-0 max-w-[1600px]">
      {isProfile ? (
        <AdminPageHeader
          title="Student profile"
          subtitle="Detailed student information and activity."
          actions={
            <Link
              href="/admin/students/all"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← All students
            </Link>
          }
        />
      ) : (
        <StudentSubnav />
      )}
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
