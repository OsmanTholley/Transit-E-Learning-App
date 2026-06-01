"use client";

import { LecturerRecord } from "@/types/lecturer";
import { AdminTableShell, ViewActionLink } from "@/components/admin/admin-table-shell";
import { StatusBadge } from "@/components/student-management/ui";
import type { ReactNode } from "react";

type Props = {
  lecturers: LecturerRecord[];
  title?: string;
  toolbar?: ReactNode;
  actions?: "none" | "view";
};

export function LecturersTable({
  lecturers,
  title = "All lecturers",
  toolbar,
  actions = "view",
}: Props) {
  const showActions = actions !== "none";
  const colCount = showActions ? 5 : 4;

  return (
    <AdminTableShell title={title} count={lecturers.length} countLabel="lecturers" toolbar={toolbar}>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="hidden md:table-column" />
          <col className="w-[100px] lg:w-[120px]" />
          <col className="hidden xl:table-column w-[96px]" />
          {showActions ? <col className="w-[72px]" /> : null}
        </colgroup>
        <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5 sm:px-4">Lecturer</th>
            <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Contact</th>
            <th className="px-3 py-2.5 sm:px-4">Status</th>
            <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Registered</th>
            {showActions ? <th className="px-3 py-2.5 text-right sm:px-4">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lecturers.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-slate-500">
                No lecturers match your filters. Add a lecturer or adjust search criteria. Add a lecturer account to get started.
              </td>
            </tr>
          ) : (
            lecturers.map((l) => (
              <tr key={l.id} className="bg-white transition-colors hover:bg-slate-50/80">
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                      {l.avatarInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{l.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{l.email}</p>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500 md:hidden" title={l.specialization}>
                    {l.specialization}
                  </p>
                </td>
                <td className="hidden px-3 py-3 md:table-cell md:px-4">
                  <p className="truncate text-slate-900" title={l.phone}>
                    {l.phone}
                  </p>
                  <p className="truncate text-xs text-slate-500">{l.assignedCourses} courses</p>
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={l.verificationStatus} />
                    <StatusBadge status={l.accountStatus} />
                  </div>
                </td>
                <td className="hidden px-3 py-3 text-xs text-slate-500 xl:table-cell xl:px-4">{l.registeredAt}</td>
                {showActions ? (
                  <td className="px-3 py-3 text-right sm:px-4">
                    <ViewActionLink href={`/admin/lecturers/${l.id}`} />
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
