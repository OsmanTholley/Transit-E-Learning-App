"use client";

import { useState, type ReactNode } from "react";
import { LecturerRecord } from "@/types/lecturer";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { AdminRowActions, confirmAndDelete } from "@/components/admin/admin-entity-crud";
import { StatusBadge } from "@/components/student-management/ui";
import { LecturerEditModal } from "./lecturer-edit-modal";

type Props = {
  lecturers: LecturerRecord[];
  title?: string;
  toolbar?: ReactNode;
  onRefresh?: () => void;
};

export function LecturersTable({
  lecturers,
  title = "All lecturers",
  toolbar,
  onRefresh,
}: Props) {
  const [editing, setEditing] = useState<LecturerRecord | null>(null);

  return (
    <>
      <AdminTableShell title={title} count={lecturers.length} countLabel="lecturers" toolbar={toolbar}>
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">Lecturer</th>
              <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Contact</th>
              <th className="px-3 py-2.5 sm:px-4">Status</th>
              <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Registered</th>
              <th className="admin-crud-table-actions-head px-3 py-2.5 sm:px-4" aria-label="Actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lecturers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  No lecturers match your filters. Add a lecturer or adjust search criteria.
                </td>
              </tr>
            ) : (
              lecturers.map((l) => (
                <tr key={l.id} className="admin-crud-table-row bg-white transition-colors hover:bg-slate-50/80">
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
                  <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                    <AdminRowActions
                      viewHref={`/admin/lecturers/${l.id}`}
                      onEdit={() => setEditing(l)}
                      onDelete={() =>
                        void confirmAndDelete(
                          `/api/lecturers/${l.id}`,
                          "This will remove the lecturer account. Their courses will be unassigned.",
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
        <LecturerEditModal
          lecturer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => onRefresh?.()}
        />
      ) : null}
    </>
  );
}
