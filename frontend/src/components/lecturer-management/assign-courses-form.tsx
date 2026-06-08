"use client";
import { LoadingState } from "@/components/ui/loading-indicator";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { useLecturers } from "@/hooks/use-lecturers";
import { FieldLabel, Panel, PrimaryButton, StatCard, StudentSection } from "@/components/student-management/ui";
import { LecturerCrudPageHero } from "./lecturer-crud-hero";
import { LecturersTable } from "./lecturers-table";

type AssignOptions = {
  lecturers: { id: string; name: string; email: string | null }[];
  departments: { id: string; name: string }[];
  courses: {
    id: string;
    label: string;
    departmentId: string | null;
    level: string | null;
    semester: string | null;
    lecturerName: string | null;
  }[];
};

const emptyForm = {
  lecturerId: "",
  departmentId: "",
  courseId: "",
};

export function AssignCoursesForm() {
  const { lecturers, loading: lecturersLoading, refetch } = useLecturers();
  const [options, setOptions] = useState<AssignOptions | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await requestApi<AssignOptions>("/api/lecturers/assign/options", {
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
      try {
        const res = await fetch(
          `/api/lecturers/assign/options?departmentId=${encodeURIComponent(form.departmentId)}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setOptions((prev) =>
          prev
            ? {
                ...prev,
                courses: data.courses,
              }
            : data,
        );
      } catch {
        /* keep previous courses */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.departmentId]);

  const courseOptions = useMemo(() => {
    if (!options) return [];
    return options.courses.filter((c) =>
      form.departmentId ? c.departmentId === form.departmentId : true,
    );
  }, [options, form.departmentId]);

  const selectedCourse = courseOptions.find((c) => c.id === form.courseId);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "departmentId") {
        next.courseId = "";
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.lecturerId || !form.courseId) {
      await showError("Missing fields", "Select a lecturer and course.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lecturers/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lecturerId: form.lecturerId, courseId: form.courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to assign course");
      await showSuccess("Course assigned", data.message);
      setForm((prev) => ({ ...prev, courseId: "" }));
      void refetch();
    } catch (err) {
      await showError("Assignment failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Panel title="Assign Course">
        <LoadingState message="Loading lecturers, departments, and courses…" layout="inline" />
      </Panel>
    );
  }

  if (!options) {
    return (
      <Panel title="Assign Course">
        <p className="text-sm text-rose-600">Could not load assignment options.</p>
      </Panel>
    );
  }

  const assignedCount = lecturers.filter((l) => l.assignedCourses > 0).length;

  return (
    <StudentSection>
      <LecturerCrudPageHero section="assign" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lecturers" value={lecturers.length} tone="amber" />
        <StatCard label="With courses" value={assignedCount} tone="blue" />
        <StatCard label="Courses in catalog" value={options.courses.length} tone="slate" />
      </div>

    <Panel title="Assign course">
      <form className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
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
        <div>
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
        {selectedCourse ? (
          <div className="sm:col-span-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            <p>
              <span className="font-semibold text-slate-800">Year:</span> {selectedCourse.level ?? "—"}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-slate-800">Semester:</span>{" "}
              {selectedCourse.semester ?? "—"}
            </p>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <PrimaryButton type="submit" disabled={submitting || options.lecturers.length === 0}>
            {submitting ? "Saving…" : "Save Assignment"}
          </PrimaryButton>
        </div>
      </form>
      {options.departments.length === 0 ? (
        <p className="mt-4 text-sm text-amber-800">
          No admin-created departments found. Add a department before assigning courses.
        </p>
      ) : null}
      {courseOptions.length === 0 && form.departmentId ? (
        <p className="mt-4 text-sm text-amber-800">No courses in this department yet.</p>
      ) : null}
    </Panel>

      {!lecturersLoading ? (
        <LecturersTable
          lecturers={lecturers}
          title="Lecturer course assignments"
          onRefresh={() => void refetch()}
        />
      ) : null}
    </StudentSection>
  );
}
