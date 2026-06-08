"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { normalizeStudentId, STUDENT_ID_FORMAT_HINT } from "@/lib/student-id";
import { requestApi } from "@/lib/fetch-api";
import { showSuccess } from "@/lib/swal";
import { StudentRecord } from "@/types/student";

type FormOptions = {
  departments: { id: string; name: string }[];
  programs: { id: string; name: string; departmentId: string | null }[];
  years: string[];
  genders: string[];
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
  isActive: boolean;
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
    isActive: student.status !== "Suspended",
  };
}

export function StudentEditModal({
  student,
  onClose,
  onSaved,
}: {
  student: StudentRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [options, setOptions] = useState<FormOptions | null>(null);
  const [form, setForm] = useState<EditForm>(() => buildEditForm(student, null));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void requestApi<FormOptions>("/api/students/options", { silent: true }).then((result) => {
      if (result.ok) {
        setOptions(result.data);
        setForm(buildEditForm(student, result.data));
      }
    });
  }, [student]);

  const programChoices = useMemo(() => {
    if (!options || !form.departmentId) return [];
    return options.programs.filter((p) => p.departmentId === form.departmentId);
  }, [options, form.departmentId]);

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") next.programId = "";
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const result = await requestApi<{ message: string }>(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: form.studentId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        isActive: form.isActive,
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
      errorTitle: "Could not update student",
    });

    setSubmitting(false);
    if (!result.ok) return;

    await showSuccess("Updated", result.data.message ?? "Student saved.");
    onSaved();
    onClose();
  }

  return (
    <div className="admin-crud-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="student-edit-title">
      <div className="admin-crud-modal admin-crud-modal--wide">
        <div className="admin-crud-modal-header admin-crud-modal-header--course">
          <div className="admin-crud-modal-header-glow" />
          <div className="admin-crud-modal-header-top">
            <div>
              <p className="admin-crud-modal-kicker">Student account</p>
              <h3 id="student-edit-title" className="admin-crud-modal-title">
                Edit student
              </h3>
              <p className="admin-crud-modal-subtitle">{student.studentId} · {student.fullName}</p>
            </div>
            <button type="button" onClick={onClose} className="admin-crud-modal-close" aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <form id="student-edit-form" onSubmit={handleSubmit}>
          <div className="admin-crud-modal-body">
            <div className="admin-crud-field-grid admin-crud-field-grid--2">
              <div className="admin-crud-field">
                <label className="admin-crud-label">Student ID</label>
                <input
                  className="admin-crud-input font-mono"
                  value={form.studentId}
                  onChange={(e) => updateField("studentId", e.target.value.toUpperCase())}
                  onBlur={(e) => {
                    const normalized = normalizeStudentId(e.target.value);
                    if (normalized) updateField("studentId", normalized);
                  }}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">{STUDENT_ID_FORMAT_HINT}</p>
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Full name</label>
                <input
                  className="admin-crud-input"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  required
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Email</label>
                <input
                  type="email"
                  className="admin-crud-input"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Phone</label>
                <input
                  className="admin-crud-input"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Department</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => updateField("departmentId", e.target.value)}
                  className="admin-crud-select"
                >
                  <option value="">Select department</option>
                  {options?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Program</label>
                <select
                  value={form.programId}
                  onChange={(e) => updateField("programId", e.target.value)}
                  disabled={!form.departmentId}
                  className="admin-crud-select"
                >
                  <option value="">{form.departmentId ? "Select program" : "Choose department first"}</option>
                  {programChoices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Year</label>
                <select
                  value={form.level}
                  onChange={(e) => updateField("level", e.target.value)}
                  className="admin-crud-select"
                >
                  <option value="">Select year</option>
                  {options?.years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="admin-crud-select"
                >
                  <option value="">Select gender</option>
                  {options?.genders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Admission year</label>
                <input
                  className="admin-crud-input"
                  value={form.admissionYear}
                  onChange={(e) => updateField("admissionYear", e.target.value)}
                />
              </div>
              <div className="admin-crud-field">
                <label className="admin-crud-label">Account status</label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Active (can sign in)
                </label>
              </div>
            </div>
          </div>
          <div className="admin-crud-modal-footer">
            <button type="submit" disabled={submitting} className="admin-crud-btn-primary">
              {submitting ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} className="admin-crud-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
