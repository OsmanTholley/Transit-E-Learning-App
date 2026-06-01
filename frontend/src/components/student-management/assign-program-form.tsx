"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useStudents } from "@/hooks/use-students";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { StudentRecord } from "@/types/student";
import { FieldLabel, Panel, PrimaryButton, SecondaryButton, SelectInput, StudentSection, TextInput } from "./ui";
import { StudentsTable } from "./students-table";

type FormOptions = {
  departments: { id: string; name: string }[];
  programs: { id: string; name: string; departmentId: string | null }[];
  years: string[];
  semesters: string[];
};

type AssignmentFields = {
  departmentId: string;
  programId: string;
  level: string;
  semester: string;
  admissionYear: string;
};

const emptyFields: AssignmentFields = {
  departmentId: "",
  programId: "",
  level: "",
  semester: "",
  admissionYear: "",
};

function isUnassigned(student: StudentRecord) {
  return student.department === "—" || student.program === "—";
}

export function AssignProgramForm() {
  const { students, loading, error, refetch } = useStudents();
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [fields, setFields] = useState<AssignmentFields>(emptyFields);
  const [singleStudentId, setSingleStudentId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<"all" | "unassigned">("all");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const result = await requestApi<FormOptions>("/api/students/options", {
        errorTitle: "Could not load options",
      });
      if (cancelled) return;
      if (result.ok) {
        setOptions(result.data);
      }
      if (!result.offline) {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const programChoices = useMemo(() => {
    if (!options || !fields.departmentId) return [];
    return options.programs.filter((p) => p.departmentId === fields.departmentId);
  }, [options, fields.departmentId]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (listFilter === "unassigned" && !isUnassigned(s)) return false;
      if (!q) return true;
      const haystack = [s.fullName, s.studentId, s.email, s.department, s.program].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [students, search, listFilter]);

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedIds.has(s.id)),
    [students, selectedIds],
  );

  const singleStudent = useMemo(
    () => students.find((s) => s.id === singleStudentId),
    [students, singleStudentId],
  );

  const unassignedCount = useMemo(() => students.filter(isUnassigned).length, [students]);

  function updateField<K extends keyof AssignmentFields>(key: K, value: AssignmentFields[K]) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        next.programId = "";
      }
      return next;
    });
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function prefillFromStudent(student: StudentRecord) {
    if (!options) return;
    const dept = options.departments.find((d) => d.name === student.department);
    const prog = options.programs.find((p) => p.name === student.program);
    setFields((prev) => ({
      ...prev,
      departmentId: dept?.id ?? prev.departmentId,
      programId: prog?.id ?? prev.programId,
      level: student.year !== "—" ? student.year : prev.level,
      semester: student.semester !== "—" ? student.semester : prev.semester,
      admissionYear: student.admissionYear !== "—" ? student.admissionYear : prev.admissionYear,
    }));
  }

  function handleSingleStudentChange(studentId: string) {
    setSingleStudentId(studentId);
    if (!studentId) {
      setFields(emptyFields);
      return;
    }
    const student = students.find((s) => s.id === studentId);
    if (student) prefillFromStudent(student);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!fields.departmentId || !fields.programId || !fields.level || !fields.semester) {
      await showError("Missing fields", "Department, program, year, and semester are required.");
      return;
    }

    const payload = {
      departmentId: fields.departmentId,
      programId: fields.programId,
      level: fields.level,
      semester: fields.semester,
      admissionYear: fields.admissionYear || null,
    };

    setSubmitting(true);
    try {
      if (mode === "single") {
        if (!singleStudentId) {
          await showError("No student selected", "Choose a student to assign a program.");
          return;
        }
        const res = await fetch(`/api/students/${singleStudentId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Assignment failed");
        await showSuccess("Program assigned", data.message);
      } else {
        if (selectedIds.size === 0) {
          await showError("No students selected", "Select one or more students for bulk assignment.");
          return;
        }
        const res = await fetch("/api/students/assign-program", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: [...selectedIds], ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Bulk assignment failed");
        await showSuccess("Programs assigned", data.message);
        clearSelection();
      }
      await refetch();
    } catch (err) {
      await showError("Assignment failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || loadingOptions) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8">
        <p className="text-sm text-slate-500">Loading students and programs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
    );
  }

  if (!options) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Could not load departments and programs. Refresh the page or check your database connection.
      </div>
    );
  }

  if (options.departments.length === 0) {
    return (
      <Panel title="Assign Academic Program">
        <p className="text-sm text-slate-600">
          No departments exist yet. Create departments and programs under{" "}
          <strong className="text-slate-800">Admin → Departments</strong> or{" "}
          <strong className="text-slate-800">Programs</strong> before assigning students.
        </p>
      </Panel>
    );
  }

  const assignmentForm = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <FieldLabel>Department</FieldLabel>
        <select
          required
          value={fields.departmentId}
          onChange={(e) => updateField("departmentId", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
        >
          <option value="">Select department…</option>
          {options.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Program</FieldLabel>
        <select
          required
          value={fields.programId}
          onChange={(e) => updateField("programId", e.target.value)}
          disabled={!fields.departmentId}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 disabled:bg-slate-50"
        >
          <option value="">{fields.departmentId ? "Select program…" : "Choose department first"}</option>
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
          options={options.years}
          value={fields.level}
          onChange={(e) => updateField("level", e.target.value)}
          placeholder="Select year"
        />
      </div>
      <div>
        <FieldLabel>Semester</FieldLabel>
        <SelectInput
          options={options.semesters}
          value={fields.semester}
          onChange={(e) => updateField("semester", e.target.value)}
          placeholder="Select semester"
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Admission year (optional)</FieldLabel>
        <TextInput
          placeholder="e.g. 2024"
          value={fields.admissionYear}
          onChange={(e) => updateField("admissionYear", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
        <p className="font-semibold text-slate-800">Controls access to:</p>
        <p className="mt-1">Courses · Lecture notes · Quizzes · Assignments</p>
      </div>
    </div>
  );

  return (
    <StudentSection>
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 border-l-emerald-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered students</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{students.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Without program</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{unassignedCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected for bulk</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{selectedIds.size}</p>
        </article>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            mode === "single"
              ? "bg-emerald-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          Single student
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            mode === "bulk"
              ? "bg-emerald-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          Bulk assign
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Panel title={mode === "single" ? "Assign to one student" : "Assign to multiple students"}>
          {mode === "single" ? (
            <div className="mb-4">
              <FieldLabel>Student</FieldLabel>
              <select
                required
                value={singleStudentId}
                onChange={(e) => handleSingleStudentChange(e.target.value)}
                className="w-full max-w-xl rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentId} — {s.fullName}
                    {isUnassigned(s) ? " (no program)" : ` (${s.program})`}
                  </option>
                ))}
              </select>
              {singleStudent ? (
                <p className="mt-2 text-xs text-slate-500">
                  Current: {singleStudent.department} · {singleStudent.program} · {singleStudent.year} ·{" "}
                  {singleStudent.semester}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mb-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <FieldLabel>Search students</FieldLabel>
                  <TextInput
                    placeholder="Name, ID, or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setListFilter("all")}
                    className={[
                      "rounded-lg px-3 py-1.5 text-xs font-semibold",
                      listFilter === "all" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    All ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setListFilter("unassigned")}
                    className={[
                      "rounded-lg px-3 py-1.5 text-xs font-semibold",
                      listFilter === "unassigned" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    Unassigned ({unassignedCount})
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton type="button" onClick={selectAllVisible}>
                  Select visible ({filteredStudents.length})
                </SecondaryButton>
                <SecondaryButton type="button" onClick={clearSelection} disabled={selectedIds.size === 0}>
                  Clear selection
                </SecondaryButton>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">No students match your filters.</p>
                ) : (
                  filteredStudents.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-slate-50/80"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900">
                          {s.fullName}{" "}
                          <span className="font-mono text-xs text-emerald-800">{s.studentId}</span>
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {isUnassigned(s) ? "No program assigned" : `${s.department} · ${s.program}`}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedStudents.length > 0 ? (
                <p className="text-xs text-slate-500">
                  Assigning to: {selectedStudents.map((s) => s.studentId).join(", ")}
                </p>
              ) : null}
            </div>
          )}

          {assignmentForm}

          <div className="mt-6 flex flex-wrap gap-2">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting
                ? "Saving…"
                : mode === "single"
                  ? "Save assignment"
                  : `Assign to ${selectedIds.size || 0} student${selectedIds.size === 1 ? "" : "s"}`}
            </PrimaryButton>
          </div>
        </Panel>
      </form>

      <StudentsTable
        students={students}
        title="Current assignments"
        variant="directory"
        showActions={false}
      />
    </StudentSection>
  );
}
