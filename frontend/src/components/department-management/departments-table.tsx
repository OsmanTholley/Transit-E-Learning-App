"use client";

import { DepartmentRecord } from "@/types/department";
import { AdminTableShell, ViewActionLink } from "@/components/admin/admin-table-shell";
import { StatusBadge } from "@/components/student-management/ui";
import type { ReactNode } from "react";

type Props = {
  departments: DepartmentRecord[];
  title?: string;
  toolbar?: ReactNode;
  actions?: "none" | "view";
};

export function DepartmentsTable({
  departments,
  title = "All departments",
  toolbar,
  actions = "view",
}: Props) {
  const showActions = actions !== "none";
  const colCount = showActions ? 5 : 4;

  return (
    <AdminTableShell title={title} count={departments.length} countLabel="departments" toolbar={toolbar}>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="hidden md:table-column" />
          <col className="w-[88px] lg:w-[100px]" />
          <col className="hidden xl:table-column w-[96px]" />
          {showActions ? <col className="w-[72px]" /> : null}
        </colgroup>
        <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2.5 sm:px-4">Department</th>
            <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Overview</th>
            <th className="px-3 py-2.5 sm:px-4">Status</th>
            <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Created</th>
            {showActions ? <th className="px-3 py-2.5 text-right sm:px-4">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {departments.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-slate-500">
                No departments match your filters. Add a department or adjust search criteria.
              </td>
            </tr>
          ) : (
            departments.map((d) => (
              <tr key={d.id} className="bg-white transition-colors hover:bg-slate-50/80">
                <td className="px-3 py-3 sm:px-4">
                  <p className="truncate font-medium text-slate-900" title={d.name}>
                    {d.name}
                  </p>
                  <p className="font-mono text-xs text-yellow-800">{d.code}</p>
                  <p className="mt-1 text-xs text-slate-500 md:hidden">
                    {d.totalPrograms} programs · {d.totalStudents.toLocaleString()} students
                  </p>
                </td>
                <td className="hidden px-3 py-3 md:table-cell md:px-4">
                  <p className="text-xs text-slate-600">
                    {d.totalPrograms} programs · {d.totalCourses} courses
                  </p>
                  <p className="text-xs text-slate-500">
                    {d.totalStudents.toLocaleString()} students · {d.totalLecturers} lecturers
                  </p>
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <StatusBadge status={d.status} />
                </td>
                <td className="hidden px-3 py-3 text-xs text-slate-500 xl:table-cell xl:px-4">{d.createdAt}</td>
                {showActions ? (
                  <td className="px-3 py-3 text-right sm:px-4">
                    <ViewActionLink href={`/admin/departments/${d.id}`} />
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
