"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { courseCategories, levels, semesters } from "@/services/academic-data";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { FieldLabel, Panel, PrimaryButton, SecondaryButton, SelectInput, TextInput } from "@/components/student-management/ui";

type CourseFormOptions = {
  departments: { id: string; name: string }[];
  programs: { id: string; name: string; departmentId: string | null }[];
  lecturers: { id: string; name: string }[];
};

const emptyForm = {
  courseCode: "",
  courseTitle: "",
  programId: "",
  lecturerId: "",
  category: "",
  level: "",
  semester: "",
};

export function AddCourseForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<CourseFormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const result = await requestApi<CourseFormOptions>("/api/courses/options", {
        errorTitle: "Could not load form",
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

  const programOptions = useMemo(() => {
    if (!options || selectedDepartmentIds.size === 0) return [];
    return options.programs.filter(
      (p) => p.departmentId && selectedDepartmentIds.has(p.departmentId)
    );
  }, [options, selectedDepartmentIds]);

  const selectedDepartments = useMemo(() => {
    if (!options) return [];
    return options.departments.filter((d) => selectedDepartmentIds.has(d.id));
  }, [options, selectedDepartmentIds]);

  function toggleDepartment(id: string) {
    setSelectedDepartmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setForm((f) => ({ ...f, programId: "" }));
  }

  function selectAllDepartments() {
    if (!options) return;
    setSelectedDepartmentIds(new Set(options.departments.map((d) => d.id)));
    setForm((f) => ({ ...f, programId: "" }));
  }

  function clearDepartments() {
    setSelectedDepartmentIds(new Set());
    setForm((f) => ({ ...f, programId: "" }));
  }

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (selectedDepartmentIds.size === 0) {
      await showError("Select departments", "Choose at least one department for this course.");
      return;
    }

    if (!form.programId) {
      await showError("Select program", "Choose a program from the selected departments.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestApi<{ message?: string }>("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentIds: [...selectedDepartmentIds],
        }),
        errorTitle: "Could not save course",
      });

      if (result.offline) return;
      if (!result.ok) return;

      await showSuccess("Course created", result.data.message ?? "Course saved successfully.");
      router.push("/admin/courses/all");
      router.refresh();
    } catch (err) {
      await showError(
        "Could not save course",
        err instanceof Error ? err.message : "Failed to save course."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingOptions) {
    return (
      <Panel title="Create Course">
        <p className="text-sm text-slate-500">Loading departments, programs, and lecturers…</p>
      </Panel>
    );
  }

  const departments = options?.departments ?? [];

  return (
    <Panel title="Create Course">
      {departments.length === 0 ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No admin-created departments found.{" "}
          <Link href="/admin/departments/add" className="font-semibold text-yellow-700 hover:underline">
            Add a department
          </Link>{" "}
          before creating a course.
        </div>
      ) : null}

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <FieldLabel>Course Code</FieldLabel>
          <TextInput
            placeholder="e.g. CSC301"
            value={form.courseCode}
            onChange={(e) => updateField("courseCode", e.target.value)}
            required
          />
          {selectedDepartmentIds.size > 1 ? (
            <p className="mt-1 text-xs text-slate-500">
              A unique suffix is added per department (e.g. CSC301-COMP, CSC301-PH).
            </p>
          ) : null}
        </div>
        <div>
          <FieldLabel>Course Title</FieldLabel>
          <TextInput
            placeholder="e.g. Database Systems"
            value={form.courseTitle}
            onChange={(e) => updateField("courseTitle", e.target.value)}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <FieldLabel>Departments</FieldLabel>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllDepartments}
                className="text-xs font-semibold text-yellow-700 hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearDepartments}
                className="text-xs font-semibold text-slate-600 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Select one or more departments. One course record is created per department.
          </p>
          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
            {departments.map((d) => (
              <label
                key={d.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 transition hover:ring-yellow-400"
              >
                <input
                  type="checkbox"
                  checked={selectedDepartmentIds.has(d.id)}
                  onChange={() => toggleDepartment(d.id)}
                  className="h-4 w-4 rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="font-medium text-slate-800">{d.name}</span>
              </label>
            ))}
          </div>
          {selectedDepartments.length > 0 ? (
            <p className="mt-2 text-xs text-slate-600">
              Selected: {selectedDepartments.map((d) => d.name).join(", ")}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Program</FieldLabel>
          <select
            required
            disabled={selectedDepartmentIds.size === 0}
            value={form.programId}
            onChange={(e) => updateField("programId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 disabled:opacity-60"
          >
            <option value="">
              {selectedDepartmentIds.size === 0
                ? "Select department(s) first…"
                : "Select program…"}
            </option>
            {programOptions.map((p) => {
              const dept = options?.departments.find((d) => d.id === p.departmentId);
              return (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {dept ? ` — ${dept.name}` : ""}
                </option>
              );
            })}
          </select>
          {selectedDepartmentIds.size > 1 ? (
            <p className="mt-1 text-xs text-slate-500">
              The same program name is used in each selected department when it exists there.
            </p>
          ) : null}
        </div>

        <div>
          <FieldLabel>Assigned Lecturer</FieldLabel>
          <select
            value={form.lecturerId}
            onChange={(e) => updateField("lecturerId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
          >
            <option value="">No lecturer yet</option>
            {(options?.lecturers ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <SelectInput
            options={courseCategories}
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <SelectInput
            options={levels}
            value={form.level}
            onChange={(e) => updateField("level", e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Semester</FieldLabel>
          <SelectInput
            options={semesters}
            value={form.semester}
            onChange={(e) => updateField("semester", e.target.value)}
            required
          />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <PrimaryButton
            type="submit"
            disabled={departments.length === 0 || submitting || selectedDepartmentIds.size === 0}
          >
            {submitting
              ? "Saving…"
              : selectedDepartmentIds.size > 1
                ? `Create ${selectedDepartmentIds.size} courses`
                : "Save Course"}
          </PrimaryButton>
          <SecondaryButton
            type="button"
            onClick={() => {
              setForm(emptyForm);
              clearDepartments();
            }}
          >
            Reset Form
          </SecondaryButton>
        </div>
      </form>

      {selectedDepartmentIds.size > 0 && programOptions.length === 0 ? (
        <p className="mt-4 text-sm text-amber-800">
          No programs in the selected department(s).{" "}
          <Link href="/admin/programs/add" className="font-semibold text-yellow-700 hover:underline">
            Add a program
          </Link>{" "}
          first.
        </p>
      ) : null}
    </Panel>
  );
}
