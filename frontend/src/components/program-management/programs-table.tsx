"use client";

import { useState } from "react";
import { ProgramRecord } from "@/types/academic";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import {
  AdminRowActions,
  AdminEntityBadge,
  confirmAndDelete,
  ProgramEditModal,
} from "@/components/admin/admin-entity-crud";
import { StatusBadge } from "@/components/student-management/ui";
import type { ReactNode } from "react";

type Props = {
  programs: ProgramRecord[];
  title?: string;
  toolbar?: ReactNode;
  onRefresh?: () => void;
};

export function ProgramsTable({
  programs,
  title = "Academic programs",
  toolbar,
  onRefresh,
}: Props) {
  const [editing, setEditing] = useState<ProgramRecord | null>(null);

  return (
    <>
      <AdminTableShell title={title} count={programs.length} countLabel="programs" toolbar={toolbar}>
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">Program</th>
              <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Department</th>
              <th className="px-3 py-2.5 sm:px-4">Status</th>
              <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Enrolled</th>
              <th className="admin-crud-table-actions-head px-3 py-2.5 sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {programs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No programs match your search. Add a program or adjust your filters.
                </td>
              </tr>
            ) : (
              programs.map((p) => (
                <tr key={p.id} className="admin-crud-table-row bg-white transition-colors hover:bg-slate-50/80">
                  <td className="px-3 py-3 sm:px-4">
                    <div className="mb-1.5">
                      <AdminEntityBadge entity="program" />
                    </div>
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
                  <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                    <AdminRowActions
                      onEdit={() => setEditing(p)}
                      onDelete={() =>
                        void confirmAndDelete(
                          `/api/programs/${p.id}`,
                          "Students must be reassigned before deleting a program.",
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
        <ProgramEditModal
          program={editing}
          onClose={() => setEditing(null)}
          onSaved={() => onRefresh?.()}
        />
      ) : null}
    </>
  );
}
