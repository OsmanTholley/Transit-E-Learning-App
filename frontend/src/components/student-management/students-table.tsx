"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { StudentRecord } from "@/types/student";
import { Panel, StatusBadge } from "./ui";

type Props = {
  students: StudentRecord[];
  /** @deprecated Use `actions` instead */
  showActions?: boolean;
  /** `none` hides the column; `view` shows View only; `full` shows View + Edit + Suspend/Activate */
  actions?: "none" | "view" | "full";
  title?: string;
  /** `directory` fits the admin content area; `detailed` shows all columns with horizontal scroll */
  variant?: "directory" | "detailed";
  toolbar?: ReactNode;
};

function resolveActionsMode(props: Pick<Props, "showActions" | "actions">): "none" | "view" | "full" {
  if (props.actions) return props.actions;
  if (props.showActions === false) return "none";
  return "full";
}

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
      <p className="truncate text-xs text-slate-500" title={`${student.department} · ${student.year} · ${student.semester}`}>
        {student.department} · {student.year} · {student.semester}
      </p>
    </div>
  );
}

function ActionButtons({ student, mode }: { student: StudentRecord; mode: "view" | "full" }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/students/${student.id}`}
        className="rounded-lg bg-yellow-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-yellow-400"
      >
        View
      </Link>
      {mode === "full" ? (
        <>
          <button
            type="button"
            className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 sm:inline-flex"
          >
            Edit
          </button>
          {student.status === "Active" ? (
            <button
              type="button"
              className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 sm:inline-flex"
            >
              Suspend
            </button>
          ) : (
            <button
              type="button"
              className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-50 sm:inline-flex"
            >
              Activate
            </button>
          )}
        </>
      ) : null}
    </div>
  );
}

function DirectoryTable({
  students,
  actionsMode,
}: {
  students: StudentRecord[];
  actionsMode: "none" | "view" | "full";
}) {
  const showActions = actionsMode !== "none";
  const colCount = showActions ? 6 : 5;

  return (
    <table className="w-full table-fixed text-sm">
      <colgroup>
        <col className="w-[100px] sm:w-[112px]" />
        <col />
        <col className="hidden md:table-column" />
        <col className="w-[88px] lg:w-[100px]" />
        <col className="hidden xl:table-column w-[108px]" />
        {showActions ? <col className={actionsMode === "view" ? "w-[72px]" : "w-[88px] sm:w-[140px]"} /> : null}
      </colgroup>
      <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-3 py-2.5 sm:px-4">ID</th>
          <th className="px-3 py-2.5 sm:px-4">Student</th>
          <th className="hidden px-3 py-2.5 md:table-cell md:px-4">Academic</th>
          <th className="px-3 py-2.5 sm:px-4">Status</th>
          <th className="hidden px-3 py-2.5 xl:table-cell xl:px-4">Registered</th>
          {showActions ? (
            <th className="px-3 py-2.5 text-right sm:px-4">Actions</th>
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
            <tr key={s.id} className="bg-white transition-colors hover:bg-slate-50/80">
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
              {showActions ? (
                <td className="px-3 py-3 sm:px-4">
                  <ActionButtons student={s} mode={actionsMode === "view" ? "view" : "full"} />
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function DetailedTable({
  students,
  actionsMode,
}: {
  students: StudentRecord[];
  actionsMode: "none" | "view" | "full";
}) {
  const showActions = actionsMode !== "none";
  const colCount = showActions ? 11 : 10;

  return (
    <table className="w-full min-w-[880px] text-left text-sm">
      <thead className="bg-slate-50/80">
        <tr>
          {[
            "Student ID",
            "Full Name",
            "Department",
            "Program",
            "Year",
            "Semester",
            "Email",
            "Phone",
            "Status",
            "Registered",
            ...(showActions ? ["Actions"] : []),
          ].map((col) => (
            <th
              key={col}
              className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {students.length === 0 ? (
          <tr>
            <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-slate-500">
              No students found.
            </td>
          </tr>
        ) : (
          students.map((s) => (
            <tr key={s.id} className="bg-white transition-colors hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-semibold text-yellow-800">
                {s.studentId}
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <StudentCell student={s} />
              </td>
              <td className="max-w-[120px] truncate px-3 py-3 text-slate-600" title={s.department}>
                {s.department}
              </td>
              <td className="max-w-[140px] truncate px-3 py-3 text-slate-600" title={s.program}>
                {s.program}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">{s.year}</td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">{s.semester}</td>
              <td className="max-w-[160px] truncate px-3 py-3 text-slate-600" title={s.email}>
                {s.email}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-slate-600">{s.phone}</td>
              <td className="whitespace-nowrap px-3 py-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{s.registeredAt}</td>
              {showActions ? (
                <td className="whitespace-nowrap px-3 py-3">
                  <ActionButtons student={s} mode={actionsMode === "view" ? "view" : "full"} />
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export function StudentsTable({
  students,
  showActions,
  actions,
  title = "Student directory",
  variant = "directory",
  toolbar,
}: Props) {
  const actionsMode = resolveActionsMode({ showActions, actions });

  return (
    <Panel
      title={title}
      noPadding
      action={
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {students.length} total
        </span>
      }
    >
      {toolbar ? <div className="border-b border-slate-100 px-4 py-3 sm:px-5">{toolbar}</div> : null}
      <div className={variant === "detailed" ? "max-w-full overflow-x-auto" : "w-full min-w-0"}>
        {variant === "directory" ? (
          <DirectoryTable students={students} actionsMode={actionsMode} />
        ) : (
          <DetailedTable students={students} actionsMode={actionsMode} />
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span>
          Showing <strong className="font-semibold text-slate-700">{students.length}</strong> student
          {students.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            disabled
          >
            Previous
          </button>
          <button type="button" className="rounded-lg bg-yellow-500 px-3 py-1.5 font-semibold text-white">
            1
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            disabled
          >
            Next
          </button>
        </div>
      </div>
    </Panel>
  );
}
