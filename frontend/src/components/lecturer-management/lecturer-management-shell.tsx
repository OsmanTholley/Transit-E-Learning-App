"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LecturerSubnav } from "./lecturer-subnav";

const lecturerPaths = new Set([
  "/admin/lecturers/all",
  "/admin/lecturers/add",
  "/admin/lecturers/assign-courses",
  "/admin/lecturers/materials",
  "/admin/lecturers/notifications",
  "/admin/lecturers/suspended",
  "/admin/lecturers/reports",
]);

export function LecturerManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = /^\/admin\/lecturers\/[^/]+$/.test(pathname) && !lecturerPaths.has(pathname);

  return (
    <div className="student-admin-layout mx-auto w-full min-w-0 max-w-[1600px]">
      {isProfile ? (
        <AdminPageHeader
          title="Lecturer profile"
          subtitle="Detailed lecturer information and teaching activity."
          actions={
            <Link
              href="/admin/lecturers/all"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← All lecturers
            </Link>
          }
        />
      ) : (
        <LecturerSubnav />
      )}
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
