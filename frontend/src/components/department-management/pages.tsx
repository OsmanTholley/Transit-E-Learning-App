"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ACADEMIC_YEARS } from "@/lib/academic-years";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { useCourses } from "@/hooks/use-courses";
import { useDepartments } from "@/hooks/use-departments";
import { useLecturers } from "@/hooks/use-lecturers";
import { usePrograms } from "@/hooks/use-programs";
import { useStudents } from "@/hooks/use-students";
import { useApiLoad } from "@/hooks/use-api-load";
import type { DepartmentRecord } from "@/types/department";
import { AllDepartmentsList } from "./all-departments-list";
import {
  FieldLabel,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  StatCard,
  StatusBadge,
  StudentSection,
  TextInput,
} from "@/components/student-management/ui";

export function AllDepartmentsPage() {
  return <AllDepartmentsList />;
}

export function AddDepartmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      await showError("Missing name", "Department name is required.");
      return;
    }
    setSubmitting(true);
    const result = await requestApi<{ message?: string }>("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentName: name.trim(), description: description.trim() }),
      errorTitle: "Could not save department",
    });
    setSubmitting(false);
    if (result.offline || !result.ok) return;
    await showSuccess("Department created", result.data.message ?? "Department saved.");
    router.push("/admin/departments/all");
    router.refresh();
  }

  return (
    <Panel title="Create Department">
      <form className="grid max-w-2xl gap-4" onSubmit={handleSubmit}>
        <div>
          <FieldLabel>Department Name</FieldLabel>
          <TextInput
            placeholder="e.g. Computing Sciences"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Department Description</FieldLabel>
          <textarea
            className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0B3D91] focus:ring-2 focus:ring-[#0B3D91]/20"
            placeholder="Brief description of the department..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Department"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => { setName(""); setDescription(""); }}>
            Reset Form
          </SecondaryButton>
        </div>
      </form>
    </Panel>
  );
}

export function ProgramsPage() {
  const { programs, loading } = usePrograms();

  return (
    <div className="space-y-6">
      <Link href="/admin/programs/add">
        <PrimaryButton>Add Program</PrimaryButton>
      </Link>
      {loading ? (
        <LoadingState message="Loading programs…" layout="inline" />
      ) : (
        <Panel title="Academic Programs by Department">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Program", "Department", "Duration", "Students", "Courses", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programs.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{p.department}</td>
                  <td className="px-3 py-2">{p.duration}</td>
                  <td className="px-3 py-2">{p.totalStudents}</td>
                  <td className="px-3 py-2">{p.totalCourses}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

export function DepartmentCoursesPage() {
  const { courses, loading } = useCourses();

  return (
    <div className="space-y-6">
      <Link href="/admin/courses/add">
        <PrimaryButton>Add Course</PrimaryButton>
      </Link>
      <Panel title="Courses by Department">
        {loading ? (
        <LoadingState message="Loading courses…" layout="inline" />
      ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Code", "Title", "Department", "Year", "Semester", "Lecturer"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-medium text-[#0B3D91]">{c.code}</td>
                  <td className="px-3 py-2">{c.title}</td>
                  <td className="px-3 py-2">{c.department}</td>
                  <td className="px-3 py-2">{c.level}</td>
                  <td className="px-3 py-2">{c.semester}</td>
                  <td className="px-3 py-2">{c.lecturer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

export function DepartmentStudentsPage() {
  const { students, loading } = useStudents();

  return (
    <Panel title="Assign Students to Departments">
      <form className="mb-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Student</FieldLabel>
          <SelectInput options={students.map((s) => `${s.studentId} – ${s.fullName}`)} />
        </div>
        <div>
          <FieldLabel>Department</FieldLabel>
          <DepartmentSelect />
        </div>
        <div>
          <FieldLabel>Program</FieldLabel>
          <ProgramSelect />
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <SelectInput options={[...ACADEMIC_YEARS]} />
        </div>
        <div className="sm:col-span-2">
          <PrimaryButton>Assign Student</PrimaryButton>
        </div>
      </form>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Student", "Department", "Program", "Year", "Actions"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={5} className="px-3 py-6">
                <LoadingState message="Loading students..." layout="compact" />
              </td>
            </tr>
          ) : null}
          {!loading && students.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                No students yet. Add students from the admin portal.
              </td>
            </tr>
          ) : null}
          {students.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-2 font-medium">{s.fullName}</td>
              <td className="px-3 py-2">{s.department}</td>
              <td className="px-3 py-2">{s.program}</td>
              <td className="px-3 py-2">{s.year}</td>
              <td className="px-3 py-2">
                <button type="button" className="text-xs font-semibold text-[#0B3D91]">
                  Transfer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function DepartmentLecturersPage() {
  const { lecturers, loading } = useLecturers();

  return (
    <Panel title="Assign Lecturers to Departments">
      <form className="mb-6 grid max-w-xl gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Lecturer</FieldLabel>
          <SelectInput options={lecturers.map((l) => l.fullName)} />
        </div>
        <div>
          <FieldLabel>Department</FieldLabel>
          <DepartmentSelect />
        </div>
        <div className="sm:col-span-2">
          <PrimaryButton>Assign Lecturer</PrimaryButton>
        </div>
      </form>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Lecturer", "Department", "Courses", "Workload", "Actions"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={5} className="px-3 py-6">
                <LoadingState message="Loading lecturers..." layout="compact" />
              </td>
            </tr>
          ) : null}
          {!loading && lecturers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                No lecturers yet. Add lecturers from the admin portal.
              </td>
            </tr>
          ) : null}
          {lecturers.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2 font-medium">{l.fullName}</td>
              <td className="px-3 py-2">{l.department}</td>
              <td className="px-3 py-2">{l.assignedCourses}</td>
              <td className="px-3 py-2">Moderate</td>
              <td className="px-3 py-2">
                <button type="button" className="text-xs font-semibold text-rose-600">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function DepartmentNotificationsPage() {
  const { data, loading } = useApiLoad<{
    notifications: { id: string; title: string; audience: string; sentAt: string; status: string }[];
  }>("/api/admin/broadcasts", { errorTitle: "Could not load notifications" });
  const notifications = data?.notifications ?? [];

  return (
    <div className="space-y-6">
      <Panel title="Send Department Notification">
        <p className="text-sm text-slate-600">
          Send targeted messages from the Students or Lecturers admin messaging pages. Recent broadcasts
          appear below.
        </p>
      </Panel>
      <Panel title="Recent Notifications">
        {loading && !data ? (
          <LoadingState message="Loading notifications…" layout="inline" />
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No broadcasts sent yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Title", "Audience", "Sent", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td className="px-3 py-2 font-medium">{n.title}</td>
                  <td className="px-3 py-2">{n.audience}</td>
                  <td className="px-3 py-2 text-slate-500">{n.sentAt}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={n.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

export function DepartmentReportsPage() {
  const { departments, loading: deptLoading } = useDepartments();
  const { data: overview, loading: overviewLoading } = useApiLoad<{
    submissionRate: number;
    quizAttempts: number;
  }>("/api/admin/academic-overview", { errorTitle: "Could not load analytics" });

  const totalStudents = departments.reduce((s, d) => s + d.totalStudents, 0);
  const totalLecturers = departments.reduce((s, d) => s + d.totalLecturers, 0);
  const totalPrograms = departments.reduce((s, d) => s + d.totalPrograms, 0);
  const totalCourses = departments.reduce((s, d) => s + d.totalCourses, 0);
  const loading = deptLoading || (overviewLoading && !overview);

  const reports = [
    { name: "Department Report", formats: ["PDF", "Excel", "CSV"] },
    { name: "Student Enrollment", formats: ["PDF", "Excel"] },
    { name: "Lecturer Distribution", formats: ["PDF", "CSV"] },
    { name: "Program Report", formats: ["PDF", "Excel"] },
    { name: "Course Report", formats: ["PDF", "Excel", "CSV"] },
    { name: "Academic Performance", formats: ["PDF", "Excel"] },
  ];

  return (
    <StudentSection>
      {loading ? (
        <LoadingState message="Loading department analytics…" layout="inline" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Students" value={totalStudents.toLocaleString()} tone="amber" />
            <StatCard label="Total Lecturers" value={totalLecturers} tone="blue" />
            <StatCard label="Active Programs" value={totalPrograms} tone="amber" />
            <StatCard label="Total Courses" value={totalCourses} tone="slate" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Students per department">
              <div className="space-y-3">
                {departments
                  .filter((d) => d.totalStudents > 0)
                  .map((d) => {
                    const pct =
                      totalStudents > 0 ? Math.round((d.totalStudents / totalStudents) * 100) : 0;
                    return (
                      <div key={d.id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{d.name}</span>
                          <span className="font-semibold">{d.totalStudents.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Panel>
            <Panel title="Platform activity">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Quiz attempts</dt>
                  <dd className="text-lg font-semibold">{overview?.quizAttempts ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Assignment grading rate</dt>
                  <dd className="text-lg font-semibold">{overview?.submissionRate ?? 0}%</dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title="Departments overview">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    {["Department", "Students", "Lecturers", "Programs", "Courses"].map((h) => (
                      <th key={h} className="px-3 py-2.5 sm:px-4">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((d) => (
                    <tr key={d.id} className="bg-white">
                      <td className="px-3 py-3 font-medium sm:px-4">{d.name}</td>
                      <td className="px-3 py-3 sm:px-4">{d.totalStudents}</td>
                      <td className="px-3 py-3 sm:px-4">{d.totalLecturers}</td>
                      <td className="px-3 py-3 sm:px-4">{d.totalPrograms}</td>
                      <td className="px-3 py-3 sm:px-4">{d.totalCourses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        </>
      )}
    </StudentSection>
  );
}

type DepartmentDetailPayload = {
  department: DepartmentRecord;
  programs: { id: string; name: string }[];
  courses: { code: string; title: string }[];
  students: { id: string; studentId: string; name: string; program: string; status: string }[];
  lecturers: { id: string; name: string; email: string }[];
};

export function DepartmentProfilePage({ id }: { id: string }) {
  const [payload, setPayload] = useState<DepartmentDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await requestApi<DepartmentDetailPayload>(`/api/departments/${id}`, {
        errorTitle: "Could not load department",
        onRecovered: () => {
          if (!cancelled) void load();
        },
      });

      if (cancelled) return;

      if (result.ok) {
        setPayload(result.data);
      } else if (!result.offline) {
        setPayload(null);
      }

      if (!result.offline) {
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading department…" layout="inline" />;
  }

  if (!payload) {
    return (
      <Panel title="Department Not Found">
        <Link href="/admin/departments/all" className="text-sm font-semibold text-[#0B3D91]">
          ← Back to all departments
        </Link>
      </Panel>
    );
  }

  const { department: dept, programs, courses, students, lecturers } = payload;

  return (
    <div className="space-y-6">
      <Link href="/admin/departments/all" className="text-sm font-semibold text-[#0B3D91]">
        ← Back to All Departments
      </Link>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{dept.name}</h2>
            <p className="text-sm text-slate-500">
              Code: {dept.code} • Head: {dept.head}
            </p>
            <div className="mt-2">
              <StatusBadge status={dept.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/programs/add">
              <PrimaryButton>Add Program</PrimaryButton>
            </Link>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">{dept.description || "No description."}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Programs" value={dept.totalPrograms} tone="blue" />
        <StatCard label="Students" value={dept.totalStudents} tone="green" />
        <StatCard label="Lecturers" value={dept.totalLecturers} tone="amber" />
        <StatCard label="Courses" value={dept.totalCourses} tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Programs">
          <ul className="space-y-2 text-sm">
            {programs.length ? (
              programs.map((p) => (
                <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  {p.name}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No programs yet</li>
            )}
          </ul>
        </Panel>
        <Panel title="Courses">
          <ul className="space-y-2 text-sm">
            {courses.length ? (
              courses.map((c) => (
                <li key={c.code} className="rounded-lg bg-slate-50 px-3 py-2">
                  {c.code} – {c.title}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No courses yet</li>
            )}
          </ul>
        </Panel>
        <Panel title="Recent students">
          <ul className="space-y-2 text-sm">
            {students.length ? (
              students.map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  {s.name} ({s.studentId}) — {s.program}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No students in this department</li>
            )}
          </ul>
        </Panel>
        <Panel title="Lecturers">
          <ul className="space-y-2 text-sm">
            {lecturers.length ? (
              lecturers.map((l) => (
                <li key={l.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  {l.name}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No lecturers assigned yet</li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function DepartmentSelect() {
  const { departments, loading } = useDepartments();
  if (loading) return <SelectInput options={["Loading…"]} />;
  return <SelectInput options={departments.map((d) => d.name)} />;
}

function ProgramSelect() {
  const { programs, loading } = usePrograms();
  if (loading) return <SelectInput options={["Loading…"]} />;
  return <SelectInput options={programs.map((p) => p.name)} />;
}
