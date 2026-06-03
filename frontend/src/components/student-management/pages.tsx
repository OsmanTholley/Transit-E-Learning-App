"use client";

import { useApiLoad } from "@/hooks/use-api-load";
import { useStudents } from "@/hooks/use-students";
import { useState } from "react";
import { AddStudentForm } from "./add-student-form";
import { AdmitStudentForm } from "./admit-student-form";
import { AllStudentsList } from "./all-students-list";
import { AssignProgramForm } from "./assign-program-form";
import { Panel, PrimaryButton, SecondaryButton, StatCard, StatusBadge, StudentSection } from "./ui";

export function AllStudentsPage() {
  return <AllStudentsList />;
}

export function AddStudentPage() {
  const [mode, setMode] = useState<"admit" | "create">("admit");

  return (
    <StudentSection>
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
    </StudentSection>
  );
}

export { VerifyStudentsPage } from "./verify-students-page";

export function StudentProgramsPage() {
  return <AssignProgramForm />;
}

export function AttendancePage() {
  const { data, loading } = useApiLoad<{
    records: {
      id: string;
      studentName: string;
      studentId: string;
      course: string;
      date: string;
      status: string;
    }[];
  }>("/api/admin/attendance", { errorTitle: "Could not load attendance" });
  const records = data?.records ?? [];

  return (
    <StudentSection>
      <Panel title="Attendance Records" noPadding>
        {loading && !data ? (
          <p className="p-4 text-sm text-slate-500">Loading attendance…</p>
        ) : records.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No attendance records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Student", "ID", "Course", "Date", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-medium">{r.studentName}</td>
                    <td className="px-3 py-2">{r.studentId}</td>
                    <td className="px-3 py-2">{r.course}</td>
                    <td className="px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </StudentSection>
  );
}

export function StudentReportsPage() {
  const { students, loading: studentsLoading } = useStudents();
  const { data: overview, loading: overviewLoading } = useApiLoad<{
    quizAttempts: number;
    submissionRate: number;
  }>("/api/admin/academic-overview", { errorTitle: "Could not load student reports" });
  const activeCount = students.filter((s) => s.status === "Active").length;
  const suspendedCount = students.filter((s) => s.status === "Suspended").length;

  const byDepartment = students.reduce<Record<string, number>>((acc, s) => {
    const key = s.department || "Unassigned";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const deptRows = Object.entries(byDepartment).sort((a, b) => b[1] - a[1]);

  const reports = [
    { name: "Student List", formats: ["PDF", "Excel", "CSV"] },
    { name: "Academic Performance", formats: ["PDF", "Excel"] },
    { name: "Attendance Report", formats: ["PDF", "CSV"] },
    { name: "Quiz Report", formats: ["PDF", "Excel"] },
    { name: "Assignment Report", formats: ["PDF", "Excel", "CSV"] },
  ];

  const loading = studentsLoading || (overviewLoading && !overview);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading student reports…</p>;
  }

  return (
    <StudentSection>
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

      <Panel title="Export reports">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <article key={r.name} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
              <h3 className="font-semibold text-slate-900">{r.name}</h3>
              <p className="mt-1 text-xs text-slate-500">Export formats: {r.formats.join(", ")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.formats.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-400"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </StudentSection>
  );
}

export { StudentProfilePage } from "./student-profile-page";
