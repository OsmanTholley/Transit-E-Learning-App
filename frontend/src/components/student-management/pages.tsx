"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { useApiLoad } from "@/hooks/use-api-load";
import { useStudents } from "@/hooks/use-students";
import { StudentsTable } from "./students-table";
import { useEffect, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showConfirm, showSuccess } from "@/lib/swal";
import { AdminRowActions, AdminCrudSearch, confirmAndDelete } from "@/components/admin/admin-entity-crud";
import { AdminTableShell } from "@/components/admin/admin-table-shell";
import { AddStudentForm } from "./add-student-form";
import { AdmitStudentForm } from "./admit-student-form";
import { AllStudentsList } from "./all-students-list";
import { AssignProgramForm } from "./assign-program-form";
import { StudentCrudPageHero } from "./student-crud-hero";
import { Panel, StatCard, StatusBadge, StudentSection } from "./ui";

export function AllStudentsPage() {
  return <AllStudentsList />;
}

export function AddStudentPage() {
  const [mode, setMode] = useState<"admit" | "create">("admit");
  const { students, loading, refetch } = useStudents();

  return (
    <StudentSection>
      <StudentCrudPageHero section="add" />

      <div className="flex w-full max-w-md flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm sm:flex-row">
        <button
          type="button"
          onClick={() => setMode("admit")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            mode === "admit" ? "bg-yellow-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Admit for registration
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            mode === "create" ? "bg-yellow-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Create account now
        </button>
      </div>
      {mode === "admit" ? <AdmitStudentForm /> : <AddStudentForm />}
      {!loading ? (
        <StudentsTable
          students={students.slice(0, 8)}
          title="Recently added students"
          onRefresh={() => void refetch()}
        />
      ) : null}
    </StudentSection>
  );
}

export { VerifyStudentsPage } from "./verify-students-page";

export function StudentProgramsPage() {
  return <AssignProgramForm />;
}

type AttendanceRecord = {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  date: string;
  status: string;
};

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "PARTIAL"] as const;

export function AttendancePage() {
  const { data, loading, reload } = useApiLoad<{ records: AttendanceRecord[] }>("/api/admin/attendance", {
    errorTitle: "Could not load attendance",
  });
  const records = data?.records ?? [];
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [studentOptions, setStudentOptions] = useState<{ id: string; label: string }[]>([]);
  const [addStudentId, setAddStudentId] = useState("");
  const [addStatus, setAddStatus] = useState<string>("PRESENT");
  const [editStatus, setEditStatus] = useState<string>("PRESENT");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void requestApi<{ students: { id: string; label: string }[] }>("/api/students/messages/targets", {
      silent: true,
    }).then((result) => {
      if (result.ok) setStudentOptions(result.data.students ?? []);
    });
  }, []);

  const filtered = records.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.studentName, r.studentId, r.course, r.status, r.date].join(" ").toLowerCase().includes(q);
  });

  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;

  async function createRecord() {
    if (!addStudentId) return;
    setSubmitting(true);
    const result = await requestApi("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: addStudentId, status: addStatus }),
      errorTitle: "Could not record attendance",
    });
    setSubmitting(false);
    if (!result.ok) return;
    setShowAdd(false);
    setAddStudentId("");
    void reload();
  }

  async function saveEdit() {
    if (!editing) return;
    setSubmitting(true);
    const result = await requestApi(`/api/admin/attendance/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus }),
      errorTitle: "Could not update attendance",
    });
    setSubmitting(false);
    if (!result.ok) return;
    setEditing(null);
    void reload();
  }

  if (loading && !data) {
    return <LoadingState message="Loading attendance…" panel minHeight={200} />;
  }

  return (
    <StudentSection>
      <StudentCrudPageHero
        section="attendance"
        actions={
          <button type="button" className="admin-crud-add-btn" onClick={() => setShowAdd(true)}>
            Mark attendance
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total records" value={records.length} tone="amber" />
        <StatCard label="Present" value={present} tone="blue" />
        <StatCard label="Absent" value={absent} tone="rose" />
        <StatCard label="Other" value={records.length - present - absent} tone="slate" />
      </div>

      <AdminTableShell
        title="Attendance records"
        count={filtered.length}
        countLabel="records"
        variant="detailed"
        toolbar={<AdminCrudSearch value={search} onChange={setSearch} placeholder="Search student, course, status…" />}
      >
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {["Student", "ID", "Course", "Date", "Status", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2.5 sm:px-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No attendance records yet. Mark attendance for a student.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="admin-crud-table-row bg-white hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-medium sm:px-4">{r.studentName}</td>
                  <td className="px-3 py-3 font-mono text-xs sm:px-4">{r.studentId}</td>
                  <td className="px-3 py-3 sm:px-4">{r.course}</td>
                  <td className="px-3 py-3 text-slate-500 sm:px-4">{r.date}</td>
                  <td className="px-3 py-3 sm:px-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                    <AdminRowActions
                      onEdit={() => {
                        setEditing(r);
                        setEditStatus(r.status);
                      }}
                      onDelete={() =>
                        void confirmAndDelete(
                          `/api/admin/attendance/${r.id}`,
                          "This attendance record will be permanently removed.",
                          () => void reload(),
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

      {showAdd ? (
        <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-crud-modal">
            <div className="admin-crud-modal-header admin-crud-modal-header--department">
              <div className="admin-crud-modal-header-top">
                <h3 className="admin-crud-modal-title">Mark attendance</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="admin-crud-modal-close">
                  ×
                </button>
              </div>
            </div>
            <div className="admin-crud-modal-body space-y-4">
              <div className="admin-crud-field">
                <label className="admin-crud-label">Student</label>
                <select
                  className="admin-crud-input"
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(e.target.value)}
                >
                  <option value="">Select student…</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Status</label>
                <select
                  className="admin-crud-input"
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                >
                  {ATTENDANCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-crud-modal-footer">
              <button
                type="button"
                disabled={submitting || !addStudentId}
                onClick={() => void createRecord()}
                className="admin-crud-btn-primary"
              >
                {submitting ? "Saving…" : "Save record"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="admin-crud-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-crud-modal">
            <div className="admin-crud-modal-header admin-crud-modal-header--department">
              <div className="admin-crud-modal-header-top">
                <h3 className="admin-crud-modal-title">Edit attendance</h3>
                <button type="button" onClick={() => setEditing(null)} className="admin-crud-modal-close">
                  ×
                </button>
              </div>
            </div>
            <div className="admin-crud-modal-body space-y-4">
              <p className="text-sm text-slate-600">
                {editing.studentName} · {editing.studentId} · {editing.date}
              </p>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Status</label>
                <select
                  className="admin-crud-input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  {ATTENDANCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-crud-modal-footer">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void saveEdit()}
                className="admin-crud-btn-primary"
              >
                {submitting ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="admin-crud-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </StudentSection>
  );
}

type ReportRow = { id: string; name: string; formats: string[] };

const defaultReports: ReportRow[] = [
  { id: "student-list", name: "Student List", formats: ["PDF", "Excel", "CSV"] },
  { id: "academic-performance", name: "Academic Performance", formats: ["PDF", "Excel"] },
  { id: "attendance", name: "Attendance Report", formats: ["PDF", "CSV"] },
  { id: "quiz", name: "Quiz Report", formats: ["PDF", "Excel"] },
  { id: "assignment", name: "Assignment Report", formats: ["PDF", "Excel", "CSV"] },
];

export function StudentReportsPage() {
  const { students, loading: studentsLoading, refetch } = useStudents();
  const { data: overview, loading: overviewLoading } = useApiLoad<{
    quizAttempts: number;
    submissionRate: number;
  }>("/api/admin/academic-overview", { errorTitle: "Could not load student reports" });
  const [reports, setReports] = useState<ReportRow[]>(defaultReports);
  const activeCount = students.filter((s) => s.status === "Active").length;
  const suspendedCount = students.filter((s) => s.status === "Suspended").length;

  const byDepartment = students.reduce<Record<string, number>>((acc, s) => {
    const key = s.department || "Unassigned";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const deptRows = Object.entries(byDepartment).sort((a, b) => b[1] - a[1]);

  const loading = studentsLoading || (overviewLoading && !overview);

  if (loading) {
    return <LoadingState message="Loading student reports…" layout="inline" />;
  }

  return (
    <StudentSection>
      <StudentCrudPageHero section="reports" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={students.length} tone="amber" />
        <StatCard label="Active Students" value={activeCount} tone="blue" />
        <StatCard label="Suspended" value={suspendedCount} tone="amber" />
        <StatCard label="Quiz Attempts" value={overview?.quizAttempts ?? 0} tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Students by department">
          <div className="space-y-3">
            {deptRows.length === 0 ? (
              <p className="text-sm text-slate-500">No students in the database yet.</p>
            ) : (
              deptRows.map(([label, count]) => {
                const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-semibold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>
        <Panel title="Assignment grading">
          <p className="text-sm text-slate-600">
            Platform-wide assignment grading completion:{" "}
            <strong>{overview?.submissionRate ?? 0}%</strong>
          </p>
        </Panel>
      </div>

      <Panel title="Top performing students">
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">No students yet. Add students to see performance data.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {students.slice(0, 8).map((s, i) => (
              <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                <span>
                  <span className="mr-2 font-bold text-yellow-600">#{i + 1}</span>
                  {s.fullName} ({s.studentId})
                </span>
                <span className="text-slate-500">{s.program} · {s.department}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <AdminTableShell title="Export reports" count={reports.length} countLabel="reports" variant="detailed">
        <table className="admin-crud-table">
          <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {["Report", "Formats", "Actions"].map((h) => (
                <th key={h} className="px-3 py-2.5 sm:px-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((r) => (
              <tr key={r.id} className="admin-crud-table-row bg-white hover:bg-slate-50/80">
                <td className="px-3 py-3 font-medium sm:px-4">{r.name}</td>
                <td className="px-3 py-3 text-slate-600 sm:px-4">{r.formats.join(", ")}</td>
                <td className="admin-crud-table-actions-cell px-3 py-3 sm:px-4">
                  <AdminRowActions
                    viewHref={`/admin/students/all`}
                    onEdit={() =>
                      void showSuccess(
                        "Export formats",
                        `${r.name} can be exported as: ${r.formats.join(", ")}.`,
                      )
                    }
                    onDelete={() =>
                      void (async () => {
                        const ok = await showConfirm(
                          "Remove report?",
                          `Remove "${r.name}" from the report catalog?`,
                        );
                        if (ok) setReports((prev) => prev.filter((row) => row.id !== r.id));
                      })()
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>

      <StudentsTable
        students={students.slice(0, 10)}
        title="Student directory (for reports)"
        onRefresh={() => void refetch()}
      />
    </StudentSection>
  );
}

export { StudentProfilePage } from "./student-profile-page";
