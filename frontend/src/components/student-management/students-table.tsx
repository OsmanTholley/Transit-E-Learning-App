"use client";

import { useState, type ReactNode } from "react";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { AdminRowActions, confirmAndDelete } from "@/components/admin/admin-entity-crud";
import { StudentRecord } from "@/types/student";
import { StatusBadge } from "./ui";
import { StudentEditModal } from "./student-edit-modal";

type Props = {
  students: StudentRecord[];
  title?: string;
  toolbar?: ReactNode;
  onRefresh?: () => void;
  /** Hide the actions column (e.g. read-only assignment preview). */
  hideActions?: boolean;
};

function StudentCell({ student }: { student: StudentRecord }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
        {student.avatarInitials}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{student.fullName}</p>
        <p className="truncate text-xs text-slate-500">{student.email}</p>
      </div>
    </div>
  );
}

function AcademicCell({ student }: { student: StudentRecord }) {
  return (
    <div className="min-w-0 max-w-[220px]">
      <p className="truncate text-slate-900" title={student.program}>
        {student.program}
      </p>
      <p
        className="truncate text-xs text-slate-500"
        title={`${student.department} · ${student.year} · ${student.gender}`}
      >
        {student.department} · {student.year} · {student.gender}
      </p>
    </div>
  );
}

export function StudentsTable({
  students,
  title = "Student directory",
  toolbar,
  onRefresh,
  hideActions = false,
}: Props) {
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const colCount = hideActions ? 5 : 6;

  return (
    <>
      <AdminTableShell title={title} count={students.length} countLabel="students" toolbar={toolbar}>
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 sm:px-4">ID</th>
              <th className="px-3 py-2.5 sm:px-4">Student</th>
              <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Academic</th>
              <th className="px-3 py-2.5 sm:px-4">Status</th>
              <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Registered</th>
              {!hideActions ? (
                <th className="admin-crud-table-actions-head px-3 py-2.5 sm:px-4">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-slate-500">
                  No students match your filters. Add a student or adjust search criteria.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="admin-crud-table-row bg-white transition-colors hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-mono text-xs font-semibold text-yellow-800 sm:px-4">{s.studentId}</td>
                  <td className="px-3 py-3 sm:px-4">
                    <StudentCell student={s} />
                    <p className="mt-1 truncate text-xs text-slate-500 md:hidden" title={s.program}>
                      {s.program}
                    </p>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell md:px-4">
                    <AcademicCell student={s} />
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-500 xl:table-cell xl:px-4">{s.registeredAt}</td>
                  {!hideActions ? (
                    <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                      <AdminRowActions
                        viewHref={`/admin/students/${s.id}`}
                        onEdit={() => setEditing(s)}
                        onDelete={() =>
                          void confirmAndDelete(
                            `/api/students/${s.id}`,
                            "This will permanently remove the student account and their enrollments.",
                            () => onRefresh?.()
                          )
                        }
                      />
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>

      {editing ? (
        <StudentEditModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => onRefresh?.()}
        />
      ) : null}
    </>
  );
}
