"use client";

import { ProgramRecord } from "@/types/academic";
import { AdminTableShell, ViewActionLink } from "@/components/admin/admin-table-shell";
import { StatusBadge } from "@/components/student-management/ui";
import type { ReactNode } from "react";

type Props = {
  programs: ProgramRecord[];
  title?: string;
  toolbar?: ReactNode;
  actions?: "none" | "view";
};

export function ProgramsTable({
  programs,
  title = "Academic programs",
  toolbar,
  actions = "view",
}: Props) {
  const showActions = actions !== "none";
  const colCount = showActions ? 5 : 4;

  return (
    <AdminTableShell title={title} count={programs.length} countLabel="programs" toolbar={toolbar}>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="hidden md:table-column" />
          <col className="w-[88px] lg:w-[100px]" />
          <col className="hidden xl:table-column w-[80px]" />
          {showActions ? <col className="w-[72px]" /> : null}
        </colgroup>
        <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5 sm:px-4">Program</th>
            <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Department</th>
            <th className="px-3 py-2.5 sm:px-4">Status</th>
            <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Enrolled</th>
            {showActions ? <th className="px-3 py-2.5 text-right sm:px-4">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {programs.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-slate-500">
                No programs match your search. Add a program or adjust your filters.
              </td>
            </tr>
          ) : (
            programs.map((p) => (
              <tr key={p.id} className="bg-white transition-colors hover:bg-slate-50/80">
                <td className="px-3 py-3 sm:px-4">
                  <p className="truncate font-medium text-slate-900" title={p.name}>
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.duration} · {p.totalCourses} courses
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400 md:hidden">{p.department}</p>
                </td>
                <td className="hidden px-3 py-3 md:table-cell md:px-4">
                  <p className="truncate text-slate-700" title={p.department}>
                    {p.department}
                  </p>
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <StatusBadge status={p.status} />
                </td>
                <td className="hidden px-3 py-3 text-xs text-slate-600 xl:table-cell xl:px-4">
                  {p.totalStudents.toLocaleString()}
                </td>
                {showActions ? (
                  <td className="px-3 py-3 text-right sm:px-4">
                    <ViewActionLink href={`/admin/programs/all`} />
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
