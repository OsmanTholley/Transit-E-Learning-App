"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DepartmentSubnav } from "./department-subnav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/departments/all": {
    title: "All Departments",
    subtitle: "Manage academic departments, programs, and institutional structure.",
  },
  "/admin/departments/add": {
    title: "Add Department",
    subtitle: "Create a new academic department for Transit College.",
  },
  "/admin/departments/programs": {
    title: "Programs",
    subtitle: "Manage programs under each department.",
  },
  "/admin/departments/students": {
    title: "Department Students",
    subtitle: "Assign and monitor students by department and program.",
  },
  "/admin/departments/lecturers": {
    title: "Department Lecturers",
    subtitle: "Assign lecturers and monitor teaching workload by department.",
  },
  "/admin/departments/notifications": {
    title: "Department Notifications",
    subtitle: "Send announcements to departments, lecturers, and students.",
  },
  "/admin/departments/reports": {
    title: "Department Reports",
    subtitle: "Department analytics, performance insights, and exportable reports.",
  },
};

const departmentPaths = new Set([
  "/admin/departments/all",
  "/admin/departments/add",
  "/admin/departments/programs",
  "/admin/departments/students",
  "/admin/departments/lecturers",
  "/admin/departments/notifications",
  "/admin/departments/reports",
]);

export function DepartmentManagementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = /^\/admin\/departments\/[^/]+$/.test(pathname) && !departmentPaths.has(pathname);
  const meta = isProfile
    ? { title: "Department Profile", subtitle: "Department details, programs, and academic overview." }
    : pageMeta[pathname] ?? pageMeta["/admin/departments/all"];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <AdminPageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          !isProfile ? (
            <Link
              href="/admin/departments/add"
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-400"
            >
              Add department
            </Link>
          ) : (
            <Link
              href="/admin/departments/all"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← All departments
            </Link>
          )
        }
      />
      {!isProfile ? <DepartmentSubnav /> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
