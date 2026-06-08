"use client";

import { useState } from "react";
import { DepartmentRecord } from "@/types/department";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import {
  AdminRowActions,
  AdminEntityBadge,
  confirmAndDelete,
  DepartmentEditModal,
} from "@/components/admin/admin-entity-crud";
import { StatusBadge } from "@/components/student-management/ui";
import type { ReactNode } from "react";

type Props = {
  departments: DepartmentRecord[];
  title?: string;
  toolbar?: ReactNode;
  onRefresh?: () => void;
};

export function DepartmentsTable({
  departments,
  title = "All departments",
  toolbar,
  onRefresh,
}: Props) {
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);

  return (
    <>
      <AdminTableShell title={title} count={departments.length} countLabel="departments" toolbar={toolbar}>
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">Department</th>
              <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Overview</th>
              <th className="px-3 py-2.5 sm:px-4">Status</th>
              <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Created</th>
              <th className="admin-crud-table-actions-head px-3 py-2.5 sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No departments match your filters. Add a department or adjust search criteria.
                </td>
              </tr>
            ) : (
              departments.map((d) => (
                <tr key={d.id} className="admin-crud-table-row bg-white transition-colors hover:bg-slate-50/80">
                  <td className="px-3 py-3 sm:px-4">
                    <div className="mb-1.5">
                      <AdminEntityBadge entity="department" />
                    </div>
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
                  <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                    <AdminRowActions
                      viewHref={`/admin/departments/${d.id}`}
                      onEdit={() => setEditing(d)}
                      onDelete={() =>
                        void confirmAndDelete(
                          `/api/departments/${d.id}`,
                          "Students must be reassigned before deleting a department.",
                          () => onRefresh?.()
                        )
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>

      {editing ? (
        <DepartmentEditModal
          department={editing}
          onClose={() => setEditing(null)}
          onSaved={() => onRefresh?.()}
        />
      ) : null}
    </>
  );
}
