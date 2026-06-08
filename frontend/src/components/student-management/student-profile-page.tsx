"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { normalizeStudentId, STUDENT_ID_FORMAT_HINT } from "@/lib/student-id";
import { showConfirm, showError, showPasswordPrompt, showSuccess } from "@/lib/swal";
import { StudentRecord } from "@/types/student";
import {
  FieldLabel,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  StatusBadge,
  StudentSection,
  TextInput,
} from "./ui";

type FormOptions = {
  departments: { id: string; name: string }[];
  programs: { id: string; name: string; departmentId: string | null }[];
  years: string[];
  genders: string[];
};

type StudentOverview = {
  courses: { id: string; code: string; title: string; enrolledAt: string }[];
  quizAverage: number | null;
  quizCount: number;
  submissions: { submitted: number; pending: number; total: number };
  attendanceRate: number | null;
  attendanceSessions: number;
  unreadNotifications: number;
  aiQuestions: number;
  lastAiActiveAt: string | null;
};

type EditForm = {
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  programId: string;
  level: string;
  gender: string;
  admissionYear: string;
};

function buildEditForm(student: StudentRecord, options: FormOptions | null): EditForm {
  const dept = options?.departments.find((d) => d.name === student.department);
  const prog = options?.programs.find((p) => p.name === student.program && (!dept || p.departmentId === dept.id));

  return {
    studentId: student.studentId,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone === "—" ? "" : student.phone,
    departmentId: dept?.id ?? "",
    programId: prog?.id ?? "",
    level: student.year === "—" ? "" : student.year,
    gender: student.gender === "—" ? "" : student.gender,
    admissionYear: student.admissionYear === "—" ? "" : student.admissionYear,
  };
}

export function StudentProfilePage({ id }: { id: string }) {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [form, setForm] = useState<EditForm | null>(null);

  useEffect(() => {
    async function loadOverview() {
      setOverviewLoading(true);
      try {
        const res = await fetch(`/api/students/${id}/overview`, { credentials: "include" });
        const data = await res.json();
        if (res.ok) setOverview(data.overview);
      } catch {
        setOverview(null);
      } finally {
        setOverviewLoading(false);
      }
    }
    loadOverview();
  }, [id]);

  useEffect(() => {
    async function load() {
      try {
        const [studentRes, optionsRes] = await Promise.all([
          fetch(`/api/students/${id}`, { credentials: "include" }),
          fetch("/api/students/options", { credentials: "include" }),
        ]);
        const studentData = await studentRes.json();
        const optionsData = await optionsRes.json();

        if (studentRes.ok) {
          setStudent(studentData.student);
          if (optionsRes.ok) {
            setOptions(optionsData);
            setForm(buildEditForm(studentData.student, optionsData));
          }
        }
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const programChoices = useMemo(() => {
    if (!options || !form?.departmentId) return [];
    return options.programs.filter((p) => p.departmentId === form.departmentId);
  }, [options, form]);

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      if (key === "departmentId") next.programId = "";
      return next;
    });
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!form || !student) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          ...(form.departmentId && form.programId && form.level
            ? {
                departmentId: form.departmentId,
                programId: form.programId,
                level: form.level,
                gender: form.gender || null,
                admissionYear: form.admissionYear || null,
              }
            : {
                level: form.level || null,
                gender: form.gender || null,
                admissionYear: form.admissionYear || null,
              }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");

      setStudent(data.student);
      setForm(buildEditForm(data.student, options));
      setEditing(false);
      const overviewRes = await fetch(`/api/students/${id}/overview`, { credentials: "include" });
      const overviewData = await overviewRes.json();
      if (overviewRes.ok) setOverview(overviewData.overview);
      await showSuccess("Student updated", data.message);
    } catch (err) {
      await showError("Update failed", err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!student) return;

    const password = await showPasswordPrompt(
      "Reset password",
      `Set a new password for ${student.fullName} (${student.studentId}).`,
    );
    if (!password) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      await showSuccess("Password reset", data.message);
    } catch (err) {
      await showError("Reset failed", err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleSuspend() {
    if (!student) return;

    const suspending = student.status === "Active";
    const confirmed = await showConfirm(
      suspending ? "Suspend student?" : "Activate student?",
      suspending
        ? `${student.fullName} will be blocked from signing in until reactivated.`
        : `${student.fullName} will be allowed to sign in again.`,
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !suspending }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Status update failed");

      setStudent(data.student);
      await showSuccess(
        suspending ? "Student suspended" : "Student activated",
        suspending ? "The account can no longer sign in." : "The account is active again.",
      );
    } catch (err) {
      await showError("Action failed", err instanceof Error ? err.message : "Could not update account status.");
    } finally {
      setActionLoading(false);
    }
  }

  function cancelEdit() {
    if (student) {
      setForm(buildEditForm(student, options));
    }
    setEditing(false);
  }

  if (loading) {
    return <LoadingState message="Loading student…" layout="inline" />;
  }

  if (!student) {
    return (
      <Panel title="Student Not Found">
        <p className="text-sm text-slate-600">
          <Link href="/admin/students/all" className="font-semibold text-yellow-700 hover:underline">
            ← Back to all students
          </Link>
        </p>
      </Panel>
    );
  }

  const isSuspended = student.status === "Suspended";

  return (
    <StudentSection>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-xl font-bold text-white">
          {student.avatarInitials}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{student.fullName}</h2>
          <p className="text-sm text-slate-500 truncate">
            {student.studentId} • {student.program}
          </p>
          <div className="mt-2">
            <StatusBadge status={student.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <SecondaryButton type="button" disabled={saving} onClick={cancelEdit}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" form="student-edit-form" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </PrimaryButton>
            </>
          ) : (
            <>
              <SecondaryButton type="button" disabled={actionLoading} onClick={() => setEditing(true)}>
                Edit
              </SecondaryButton>
              <SecondaryButton type="button" disabled={actionLoading} onClick={handleResetPassword}>
                Reset Password
              </SecondaryButton>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleSuspend}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60",
                  isSuspended ? "bg-yellow-500 hover:bg-yellow-400" : "bg-rose-600 hover:bg-rose-500",
                ].join(" ")}
              >
                {isSuspended ? "Activate" : "Suspend"}
              </button>
            </>
          )}
        </div>
      </div>

      {editing && form ? (
        <Panel title="Edit student">
          <form id="student-edit-form" className="grid gap-4 sm:grid-cols-2" onSubmit={handleSaveEdit}>
            <div>
              <FieldLabel>Student ID</FieldLabel>
              <TextInput
                value={form.studentId}
                onChange={(e) => updateField("studentId", e.target.value.toUpperCase())}
                onBlur={(e) => {
                  const normalized = normalizeStudentId(e.target.value);
                  if (normalized) updateField("studentId", normalized);
                }}
                required
                placeholder="TCSL/0001"
              />
              <p className="mt-1 text-xs text-slate-500">{STUDENT_ID_FORMAT_HINT}</p>
            </div>
            <div>
              <FieldLabel>Full name</FieldLabel>
              <TextInput
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <TextInput value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Admission year</FieldLabel>
              <TextInput
                value={form.admissionYear}
                onChange={(e) => updateField("admissionYear", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Department</FieldLabel>
              <select
                value={form.departmentId}
                onChange={(e) => updateField("departmentId", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
              >
                <option value="">Select department…</option>
                {options?.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Program</FieldLabel>
              <select
                value={form.programId}
                onChange={(e) => updateField("programId", e.target.value)}
                disabled={!form.departmentId}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 disabled:bg-slate-50"
              >
                <option value="">{form.departmentId ? "Select program…" : "Choose department first"}</option>
                {programChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Year</FieldLabel>
              <SelectInput
                options={options?.years ?? []}
                value={form.level}
                onChange={(e) => updateField("level", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Gender</FieldLabel>
              <SelectInput
                options={options?.genders ?? []}
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              />
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Personal Information">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["Student ID", student.studentId],
              ["Email", student.email],
              ["Phone", student.phone],
              ["Admission Year", student.admissionYear],
              ["Registered", student.registeredAt],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Academic Information">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["Department", student.department],
              ["Program", student.program],
              ["Year", student.year],
              ["Gender", student.gender],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Enrolled Courses">
          {overviewLoading ? (
            <LoadingState message="Loading courses…" layout="inline" />
          ) : !overview?.courses.length ? (
            <p className="text-sm text-slate-500">No enrolled courses yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {overview.courses.map((course) => (
                <li key={course.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span>
                    {course.code} – {course.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Quiz Performance">
          {overviewLoading ? (
            <LoadingState message="Loading…" layout="inline" />
          ) : overview?.quizAverage !== null && overview?.quizAverage !== undefined ? (
            <>
              <p className="text-2xl font-bold text-teal-700">{overview.quizAverage}%</p>
              <p className="text-xs text-slate-500">Average across {overview.quizCount} quiz attempts</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No quiz attempts recorded yet.</p>
          )}
        </Panel>
        <Panel title="Assignment Submissions">
          {overviewLoading ? (
            <LoadingState message="Loading…" layout="inline" />
          ) : overview ? (
            <p className="text-sm">
              {overview.submissions.submitted} submitted • {overview.submissions.pending} pending
              {overview.submissions.total > 0 ? ` (${overview.submissions.total} total)` : ""}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No submission data.</p>
          )}
        </Panel>
        <Panel title="Attendance">
          {overviewLoading ? (
            <LoadingState message="Loading…" layout="inline" />
          ) : overview?.attendanceRate !== null && overview?.attendanceRate !== undefined ? (
            <p className="text-sm">
              {overview.attendanceRate}% present rate ({overview.attendanceSessions} sessions recorded)
            </p>
          ) : (
            <p className="text-sm text-slate-500">No attendance records yet.</p>
          )}
        </Panel>
        <Panel title="Notifications">
          {overviewLoading ? (
            <LoadingState message="Loading…" layout="inline" />
          ) : (
            <p className="text-sm text-slate-600">
              {overview?.unreadNotifications ?? 0} unread platform notification
              {(overview?.unreadNotifications ?? 0) === 1 ? "" : "s"}
            </p>
          )}
        </Panel>
        <Panel title="AI Tutor Usage">
          {overviewLoading ? (
            <LoadingState message="Loading…" layout="inline" />
          ) : (
            <p className="text-sm">
              {overview?.aiQuestions ?? 0} questions asked
              {overview?.lastAiActiveAt
                ? ` • Last active ${new Date(overview.lastAiActiveAt).toLocaleDateString()}`
                : ""}
            </p>
          )}
        </Panel>
      </div>
    </StudentSection>
  );
}
