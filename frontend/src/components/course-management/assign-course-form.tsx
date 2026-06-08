"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { FieldLabel, Panel, PrimaryButton } from "@/components/student-management/ui";

type CourseAssignOptions = {
  lecturers: { id: string; name: string; email: string | null }[];
  departments: { id: string; name: string }[];
  programs: { id: string; name: string; departmentId: string | null }[];
  years: string[];
  semesters: string[];
  courses: {
    id: string;
    label: string;
    code: string;
    title: string;
    departmentId: string | null;
    programId: string | null;
    programName: string;
    level: string;
    semester: string;
    lecturerId: string | null;
    lecturerName: string | null;
  }[];
};

const emptyForm = {
  lecturerId: "",
  departmentId: "",
  courseId: "",
  programId: "",
  level: "",
  semester: "",
};

export function AssignCourseForm() {
  const [options, setOptions] = useState<CourseAssignOptions | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await requestApi<CourseAssignOptions>("/api/courses/assign/options", {
        errorTitle: "Could not load form",
      });
      if (cancelled) return;
      if (result.ok) {
        setOptions(result.data);
      }
      if (!result.offline) {
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.departmentId) return;
    let cancelled = false;

    (async () => {
      const result = await requestApi<CourseAssignOptions>(
        `/api/courses/assign/options?departmentId=${encodeURIComponent(form.departmentId)}`,
        { silent: true }
      );
      if (cancelled || !result.ok) return;
      setOptions((prev) =>
        prev
          ? {
              ...prev,
              courses: result.data.courses,
            }
          : result.data
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [form.departmentId]);

  const courseOptions = useMemo(() => {
    if (!options) return [];
    return options.courses.filter((c) =>
      form.departmentId ? c.departmentId === form.departmentId : true
    );
  }, [options, form.departmentId]);

  const programOptions = useMemo(() => {
    if (!options) return [];
    if (!form.departmentId) return options.programs;
    return options.programs.filter((p) => p.departmentId === form.departmentId);
  }, [options, form.departmentId]);

  const selectedCourse = courseOptions.find((c) => c.id === form.courseId);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "departmentId") {
        next.courseId = "";
        next.programId = "";
      }
      if (field === "courseId") {
        const course = options?.courses.find((c) => c.id === value);
        if (course) {
          next.programId = course.programId ?? "";
          next.level = course.level || prev.level;
          next.semester = course.semester || prev.semester;
        }
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.lecturerId || !form.courseId || !form.programId || !form.level || !form.semester) {
      await showError("Missing fields", "Select course, lecturer, program, year, and semester.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestApi<{ message?: string }>("/api/courses/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecturerId: form.lecturerId,
          courseId: form.courseId,
          programId: form.programId,
          level: form.level,
          semester: form.semester,
        }),
        errorTitle: "Assignment failed",
      });

      if (result.offline) return;

      if (!result.ok) {
        return;
      }

      await showSuccess("Course assigned", result.data.message ?? "Assignment saved successfully.");
      setForm((prev) => ({ ...prev, courseId: "" }));
    } catch (err) {
      await showError(
        "Assignment failed",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Panel title="Assign Course">
        <LoadingState message="Loading courses, lecturers, and programs…" layout="inline" />
      </Panel>
    );
  }

  if (!options) {
    return (
      <Panel title="Assign Course">
        <p className="text-sm text-slate-500">Could not load assignment options.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Assign Course">
      {options.departments.length === 0 ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No departments found.{" "}
          <Link href="/admin/departments/add" className="font-semibold text-yellow-700 hover:underline">
            Add a department
          </Link>{" "}
          before assigning courses.
        </div>
      ) : null}

      <form className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div className="sm:col-span-2">
          <FieldLabel>Department</FieldLabel>
          <select
            required
            value={form.departmentId}
            onChange={(e) => updateField("departmentId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
          >
            <option value="">Select department…</option>
            {options.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Course</FieldLabel>
          <select
            required
            disabled={!form.departmentId}
            value={form.courseId}
            onChange={(e) => updateField("courseId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 disabled:opacity-60"
          >
            <option value="">
              {form.departmentId ? "Select course…" : "Select department first…"}
            </option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
                {c.lecturerName ? ` (current: ${c.lecturerName})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Lecturer</FieldLabel>
          <select
            required
            value={form.lecturerId}
            onChange={(e) => updateField("lecturerId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
          >
            <option value="">Select lecturer…</option>
            {options.lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.email ? `${l.name} (${l.email})` : l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Program</FieldLabel>
          <select
            required
            disabled={!form.departmentId}
            value={form.programId}
            onChange={(e) => updateField("programId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15 disabled:opacity-60"
          >
            <option value="">
              {form.departmentId ? "Select program…" : "Select department first…"}
            </option>
            {programOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Year</FieldLabel>
          <select
            required
            value={form.level}
            onChange={(e) => updateField("level", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
          >
            <option value="">Select year…</option>
            {options.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Semester</FieldLabel>
          <select
            required
            value={form.semester}
            onChange={(e) => updateField("semester", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/15"
          >
            <option value="">Select semester…</option>
            {options.semesters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {selectedCourse ? (
          <div className="sm:col-span-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            <p>
              Assigning updates which lecturer teaches this course and sets program, year, and semester
              for student visibility.
            </p>
          </div>
        ) : (
          <div className="sm:col-span-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
            Determines which students see the course and which lecturer can upload materials.
          </div>
        )}

        <div className="sm:col-span-2">
          <PrimaryButton
            type="submit"
            disabled={
              submitting ||
              options.lecturers.length === 0 ||
              options.departments.length === 0
            }
          >
            {submitting ? "Saving…" : "Save Assignment"}
          </PrimaryButton>
        </div>
      </form>

      {courseOptions.length === 0 && form.departmentId ? (
        <p className="mt-4 text-sm text-amber-800">
          No courses in this department yet.{" "}
          <Link href="/admin/courses/add" className="font-semibold text-yellow-700 hover:underline">
            Add a course
          </Link>{" "}
          first.
        </p>
      ) : null}
    </Panel>
  );
}
