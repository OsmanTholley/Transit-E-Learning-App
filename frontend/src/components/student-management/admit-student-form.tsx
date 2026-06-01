"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { normalizeStudentId } from "@/lib/student-id";
import { requestApi } from "@/lib/fetch-api";
import { showError, showSuccess } from "@/lib/swal";
import { FieldLabel, Panel, PrimaryButton, SecondaryButton, SelectInput, TextInput } from "./ui";

type FormOptions = {
  departments: { id: string; name: string }[];
  programs: { id: string; name: string; departmentId: string | null }[];
  years: string[];
  semesters: string[];
  nextStudentId?: string;
  studentIdFormat?: string;
};

const emptyForm = {
  fullName: "",
  studentId: "",
  departmentName: "",
  programName: "",
  year: "",
  semester: "",
  admissionYear: "",
};

export function AdmitStudentForm() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const result = await requestApi<FormOptions>("/api/students/options", {
        errorTitle: "Could not load form",
      });
      if (cancelled) return;
      if (result.ok) {
        setOptions(result.data);
        if (result.data.nextStudentId) {
          setForm((prev) => ({ ...prev, studentId: result.data.nextStudentId! }));
        }
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
    if (!options) return [];
    if (!form.departmentName) {
      return options.programs.map((p) => p.name);
    }
    const dept = options.departments.find((d) => d.name === form.departmentName);
    if (!dept) return [];
    return options.programs.filter((p) => p.departmentId === dept.id).map((p) => p.name);
  }, [options, form.departmentName]);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "departmentName") {
        next.programName = "";
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/students/admit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to admit student.");
      }

      await showSuccess("Student admitted", data.message ?? "Student can now self-register.");
      router.push("/admin/students/verify");
      router.refresh();
    } catch (err) {
      await showError("Could not admit student", err instanceof Error ? err.message : "Failed to admit student.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingOptions) {
    return (
      <Panel title="Admit Student for Registration">
        <p className="text-sm text-slate-500">Loading form...</p>
      </Panel>
    );
  }

  return (
    <Panel title="Admit Student for Registration">
      <p className="mb-4 text-sm text-slate-600">
        Add the student to the admitted database. They will verify their TCSL/ ID at{" "}
        <strong>/register</strong> before creating their account.
      </p>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <FieldLabel>Full Name *</FieldLabel>
          <TextInput
            placeholder="e.g. John Kamara"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            required
          />
        </div>
        <div>
          <FieldLabel>Student ID *</FieldLabel>
          <TextInput
            placeholder="e.g. TCSL/001"
            value={form.studentId}
            onChange={(e) => updateField("studentId", e.target.value)}
            onBlur={(e) => {
              const normalized = normalizeStudentId(e.target.value);
              if (normalized) {
                updateField("studentId", normalized);
              }
            }}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Format: {options?.studentIdFormat ?? "TCSL/001"}
          </p>
        </div>
        <div>
          <FieldLabel>Department</FieldLabel>
          <SelectInput
            placeholder="Select department"
            options={options?.departments.map((d) => d.name) ?? []}
            value={form.departmentName}
            onChange={(e) => updateField("departmentName", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Program</FieldLabel>
          <SelectInput
            placeholder="Select program"
            options={programOptions}
            value={form.programName}
            onChange={(e) => updateField("programName", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Year</FieldLabel>
          <SelectInput
            placeholder="Select year"
            options={options?.years ?? []}
            value={form.year}
            onChange={(e) => updateField("year", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Semester</FieldLabel>
          <SelectInput
            placeholder="Select semester"
            options={options?.semesters ?? []}
            value={form.semester}
            onChange={(e) => updateField("semester", e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Admission Year</FieldLabel>
          <TextInput
            placeholder="2025"
            value={form.admissionYear}
            onChange={(e) => updateField("admissionYear", e.target.value)}
          />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Saving..." : "Admit Student"}
          </PrimaryButton>
          <SecondaryButton type="button" disabled={loading} onClick={() => setForm(emptyForm)}>
            Reset Form
          </SecondaryButton>
        </div>
      </form>
    </Panel>
  );
}
